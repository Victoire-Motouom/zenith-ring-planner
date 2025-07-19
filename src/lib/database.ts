import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  goalId?: number; // Link to a financial goal
}

export interface Budget {
  id?: number;
  category: string;
  amount: number;
  month: string; // Format: YYYY-MM
  createdAt: Date;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  ring: 'earth' | 'water' | 'fire' | 'wind' | 'void';
  date: Date;
  timeSlot?: string;
  category?: string;
  createdAt: Date;
}

export interface Reflection {
  id?: number;
  date: Date;
  ring: 'earth' | 'water' | 'fire' | 'wind' | 'void';
  prompt: string;
  content: string;
  insights?: string;
  createdAt: Date;
}

export interface RecurringTransaction {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  startDate: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: Date;
  nextDueDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Goal {
  id?: number;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: 'financial' | 'personal';
  reminderDate?: Date;
  reminderSent?: boolean;
  createdAt: Date;
}

export interface StrategicStep {
  id?: number;
  goalId: number;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
}

export interface AppSetting {
  key: string;
  value: any;
}

export interface Insight {
  id?: number;
  content: string;
  createdAt: Date;
}

export interface Habit {
  id?: number;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: 'general' | 'financial';
  createdAt: Date;
}

export interface HabitEntry {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface TimeSlot {
  id?: number;
  title: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  date: string;      // YYYY-MM-DD
  taskId?: number;
  createdAt: Date;
}

export class ZenithDatabase extends Dexie {
  transactions!: Table<Transaction>;
  budgets!: Table<Budget>;
  tasks!: Table<Task>;
  reflections!: Table<Reflection>;
  recurringTransactions!: Table<RecurringTransaction>;
  goals!: Table<Goal, number>;
  strategicSteps!: Table<StrategicStep, number>;
  settings!: Table<AppSetting, string>;
  insights!: Table<Insight, number>;
  habits!: Table<Habit, number>;
  habitEntries!: Table<HabitEntry, number>;
  timeSlots!: Table<TimeSlot>;

  constructor() {
    super('ZenithPlannerDB');
    

    // IMPORTANT: Dexie versions must be declared in ascending order.
    this.version(1).stores({
      transactions: '++id, type, category, date, createdAt',
      budgets: '++id, category, month, createdAt',
      tasks: '++id, completed, priority, ring, date, createdAt',
      reflections: '++id, date, ring, createdAt',
      goals: '++id, category, targetDate, createdAt'
    });

    this.version(2).stores({
      recurringTransactions: '++id, nextDueDate, isActive, createdAt'
    });

    this.version(3).stores({
      transactions: '++id, type, category, date, createdAt',
      budgets: '++id, category, month, createdAt',
      tasks: '++id, completed, priority, ring, date, createdAt, category',
      reflections: '++id, date, ring, createdAt',
      goals: '++id, category, targetDate, createdAt',
      recurringTransactions: '++id, nextDueDate, isActive, createdAt',
      strategicSteps: '++id, goalId, isCompleted',
      settings: '&key'
    }).upgrade(_tx => {
      // This is a schema-only upgrade, so we don't need to modify existing data.
      // We are adding a new indexed property 'category' to the 'tasks' table.
      // Dexie handles this automatically when the schema definition changes.
      // The 'tasks' store from a previous version is implicitly carried forward.
      // We just need to redefine it with the new index.
      return _tx.table('tasks').toCollection().count(); // No-op to trigger schema update
    });

    this.version(4).stores({
      goals: '++id,category,targetDate,createdAt,reminderDate,reminderSent',
      insights: '++id, createdAt'
    });

    this.version(5).stores({
      habits: '++id, name, category, createdAt',
      habitEntries: '++id, &[habitId+date]'
    });

    this.version(6).stores({
      habitEntries: '++id, &[habitId+date], date' // Add index for date
    });

    this.version(7).stores({
      timeSlots: '++id, date, startTime'
    });

    this.version(8).stores({
      transactions: '++id, type, category, date, createdAt, goalId' // Added goalId index
    });

    this.on('populate', () => {
      this.habits.bulkAdd([
        // General Habits
        { name: 'Read for 15 minutes', frequency: 'daily', category: 'general', createdAt: new Date() },
        { name: 'Go for a walk', frequency: 'daily', category: 'general', createdAt: new Date() },
        { name: 'Weekly review', frequency: 'weekly', category: 'general', createdAt: new Date() },
        { name: 'Tidy up workspace', frequency: 'weekly', category: 'general', createdAt: new Date() },
        // Financial Habits
        { name: 'Log all expenses', frequency: 'daily', category: 'financial', createdAt: new Date() },
        { name: 'Review budget', frequency: 'weekly', category: 'financial', createdAt: new Date() },
        { name: 'Check investment portfolio', frequency: 'monthly', category: 'financial', createdAt: new Date() },
      ]);
    });

    // The final schema definition for the latest version
    this.tasks.mapToClass(Object);
    this.transactions.mapToClass(Object);
    this.budgets.mapToClass(Object);
    this.reflections.mapToClass(Object);
    this.goals.mapToClass(Object);
    this.recurringTransactions.mapToClass(Object);
    this.timeSlots.mapToClass(Object);
  }


}

export const db = new ZenithDatabase();

// Helper functions for common operations
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
  return await db.transactions.add({
    ...transaction,
    createdAt: new Date(),
  });
};

export const processRecurringTransactions = async () => {
  const now = new Date();
  const dueTransactions = await db.recurringTransactions
    .where('nextDueDate').belowOrEqual(now)
    .and(t => t.isActive === true)
    .toArray();

  if (dueTransactions.length === 0) {
    return;
  }

  for (const rt of dueTransactions) {
    // Add a new standard transaction
    await addTransaction({
      amount: rt.amount,
      type: rt.type,
      category: rt.category,
      description: rt.description,
      date: rt.nextDueDate,
    });

    // Calculate the next due date
    const newDueDate = new Date(rt.nextDueDate);
    switch (rt.frequency) {
      case 'daily':
        newDueDate.setDate(newDueDate.getDate() + 1);
        break;
      case 'weekly':
        newDueDate.setDate(newDueDate.getDate() + 7);
        break;
      case 'monthly':
        newDueDate.setMonth(newDueDate.getMonth() + 1);
        break;
      case 'yearly':
        newDueDate.setFullYear(newDueDate.getFullYear() + 1);
        break;
    }

    // Deactivate if past end date
    const isActive = rt.endDate ? newDueDate <= rt.endDate : true;

    // Update the recurring transaction
    await db.recurringTransactions.update(rt.id!, {
      nextDueDate: newDueDate,
      isActive,
    });
  }
};

export const getTransactionsByDateRange = async (startDate: Date, endDate: Date) => {
  return await db.transactions
    .where('date')
    .between(startDate, endDate)
    .toArray();
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
  return await db.tasks.add({
    ...task,
    createdAt: new Date()
  });
};

export const getTasksByDate = async (date: Date) => {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  
  return await db.tasks
    .where('date')
    .between(startOfDay, endOfDay)
    .toArray();
};

export const addBudget = async (budget: Omit<Budget, 'id' | 'createdAt'>) => {
  return await db.budgets.add({
    ...budget,
    createdAt: new Date()
  });
};

export const getBudgetByMonth = async (month: string) => {
  return await db.budgets
    .where('month')
    .equals(month)
    .toArray();
};