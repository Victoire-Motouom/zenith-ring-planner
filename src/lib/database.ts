import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  goalId?: number;
}

export interface Budget {
  id?: number;
  category: string;
  amount: number;
  month: string;
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
  date: string;
  completed: boolean;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
  count?: number;
  exceptions?: string[];
}

export interface RecurrenceRuleWithDate {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[];
  count?: number;
  exceptions?: string[];
}

export function toRecurrenceRule(rule: RecurrenceRuleWithDate): RecurrenceRule {
  return {
    ...rule,
    endDate: rule.endDate ? rule.endDate.toISOString().split('T')[0] : undefined,
  };
}

export function fromRecurrenceRule(rule: RecurrenceRule): RecurrenceRuleWithDate {
  return {
    ...rule,
    endDate: rule.endDate ? new Date(rule.endDate) : undefined,
  };
}

export interface TimeSlot {
  id?: number;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  description?: string;
  category?: string;
  taskId?: number;
  completed?: boolean;
  order?: number;
  createdAt: Date;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  parentId?: number;
  isInstance?: boolean;
  recurrenceId?: number;
  originalStartTime?: string;
  originalEndTime?: string;
}

export class ZenithDatabase extends Dexie {
  transactions!: Table<Transaction>;
  budgets!: Table<Budget>;
  tasks!: Table<Task>;
  reflections!: Table<Reflection>;
  recurringTransactions!: Table<RecurringTransaction>;
  goals!: Table<Goal>;
  strategicSteps!: Table<StrategicStep>;
  settings!: Table<AppSetting>;
  insights!: Table<Insight>;
  habits!: Table<Habit>;
  habitEntries!: Table<HabitEntry>;
  timeSlots!: Table<TimeSlot>;

  constructor() {
    super('ZenithPlannerDB');

    this.version(1).stores({
      transactions: '++id, type, category, date, createdAt',
      budgets: '++id, category, month, createdAt',
      tasks: '++id, completed, priority, ring, date, createdAt',
      reflections: '++id, date, ring, createdAt',
      goals: '++id, category, targetDate, createdAt',
    });

    this.version(2).stores({
      recurringTransactions: '++id, nextDueDate, isActive, createdAt',
    });

    this.version(3).stores({
      tasks: '++id, completed, priority, ring, date, createdAt, category',
      strategicSteps: '++id, goalId, isCompleted',
      settings: '&key',
    });

    this.version(4).stores({
      goals: '++id,category,targetDate,createdAt,reminderDate,reminderSent',
      insights: '++id, createdAt',
    });

    this.version(5).stores({
      habits: '++id, name, category, createdAt',
      habitEntries: '++id, &[habitId+date]',
    });

    this.version(6).stores({
      habitEntries: '++id, &[habitId+date], date',
    });

    this.version(7).stores({
      timeSlots: '++id, date, startTime',
    });

    this.version(8).stores({
      timeSlots: '++id, date, startTime, completed, isRecurring, parentId, isInstance, [parentId+date]',
    });

    this.version(9).stores({
      transactions: '++id, type, category, date, createdAt, goalId',
    });

    this.on('populate', () => {
      this.habits.bulkAdd([
        { name: 'Read for 15 minutes', frequency: 'daily', category: 'general', createdAt: new Date() },
        { name: 'Go for a walk', frequency: 'daily', category: 'general', createdAt: new Date() },
        { name: 'Weekly review', frequency: 'weekly', category: 'general', createdAt: new Date() },
        { name: 'Tidy up workspace', frequency: 'weekly', category: 'general', createdAt: new Date() },
        { name: 'Log all expenses', frequency: 'daily', category: 'financial', createdAt: new Date() },
        { name: 'Review budget', frequency: 'weekly', category: 'financial', createdAt: new Date() },
        { name: 'Check investment portfolio', frequency: 'monthly', category: 'financial', createdAt: new Date() },
      ]);
    });
  }
}

export const db = new ZenithDatabase();

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>) {
  return await db.transactions.add({
    ...transaction,
    createdAt: new Date(),
  });
}

export async function updateTransaction(id: number, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) {
  return await db.transactions.update(id, updates);
}

export async function deleteTransaction(id: number) {
  return await db.transactions.delete(id);
}

export async function processRecurringTransactions() {
  const now = new Date();
  const dueTransactions = await db.recurringTransactions
    .where('nextDueDate').belowOrEqual(now)
    .and(t => t.isActive === true)
    .toArray();

  if (dueTransactions.length === 0) {
    return;
  }

  for (const rt of dueTransactions) {
    await addTransaction({
      amount: rt.amount,
      type: rt.type,
      category: rt.category,
      description: rt.description,
      date: rt.nextDueDate,
    });

    // Calculate next due date
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

    await db.recurringTransactions.update(rt.id!, {
      nextDueDate: newDueDate,
      isActive,
    });
  }
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  return await db.transactions
    .where('date')
    .between(startDate, endDate)
    .toArray();
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt'>) {
  return await db.tasks.add({
    ...task,
    createdAt: new Date(),
  });
}

export async function getTasksByDate(date: Date) {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  
  return await db.tasks
    .where('date')
    .between(startOfDay, endOfDay)
    .toArray();
}

export async function addBudget(budget: Omit<Budget, 'id' | 'createdAt'>) {
  return await db.budgets.add({
    ...budget,
    createdAt: new Date(),
  });
}

export async function getBudgetByMonth(month: string) {
  return await db.budgets
    .where('month')
    .equals(month)
    .toArray();
}
