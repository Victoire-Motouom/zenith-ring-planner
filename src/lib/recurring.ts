import { db } from './database';

const calculateNextDueDate = (currentDueDate: Date, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date => {
  const nextDate = new Date(currentDueDate);
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  return nextDate;
};

export const processRecurringTransactions = async () => {
  const now = new Date();
  const dueTransactions = await db.recurringTransactions
    .where('nextDueDate').belowOrEqual(now)
    .and(item => item.isActive === true)
    .toArray();

  if (dueTransactions.length === 0) {
    return;
  }

  for (const recurring of dueTransactions) {
    // Add to main transactions table
    await db.transactions.add({
      amount: recurring.amount,
      type: recurring.type,
      category: recurring.category,
      description: recurring.description,
      date: recurring.nextDueDate,
      createdAt: new Date(),
    });

    // Update the recurring transaction
    const nextDueDate = calculateNextDueDate(recurring.nextDueDate, recurring.frequency);

    if (recurring.endDate && nextDueDate > recurring.endDate) {
      // End date reached, deactivate
      await db.recurringTransactions.update(recurring.id!, { isActive: false });
    } else {
      // Update next due date
      await db.recurringTransactions.update(recurring.id!, { nextDueDate });
    }
  }

  console.log(`Processed ${dueTransactions.length} recurring transactions.`);
};
