import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import {
  Bar, 
  BarChart, 
  Pie, 
  PieChart, 
  LineChart,
  Line,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { startOfMonth, endOfMonth, subMonths, format, subDays } from 'date-fns';

const ReportingSection: React.FC = () => {
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];

  const monthlySummary = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const relevantTransactions = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd);

    const income = relevantTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = relevantTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return [{ name: 'Monthly', income, expenses }];
  }, [transactions]);

  const categorySpending = useMemo(() => {
    const expenseByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as { [key: string]: number });

    return Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const categoryTrends = useMemo(() => {
    const trendData: { [month: string]: { [category: string]: number } } = {};
    const categories = new Set<string>();

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'yyyy-MM');
      trendData[monthKey] = {};
    }

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const monthKey = format(t.date, 'yyyy-MM');
        if (trendData[monthKey]) {
          trendData[monthKey][t.category] = (trendData[monthKey][t.category] || 0) + t.amount;
          categories.add(t.category);
        }
      });

    return Object.entries(trendData).map(([month, data]) => ({
      month,
      ...data,
    }));
  }, [transactions]);

  const productivityMetrics = useMemo(() => {
    const metrics = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const relevantTasks = tasks.filter(t => format(t.date, 'yyyy-MM-dd') === dateStr);
      const completedTasks = relevantTasks.filter(t => t.completed).length;
      const totalTasks = relevantTasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      metrics.push({ date: format(date, 'MMM d'), completionRate });
    }
    return metrics;
  }, [tasks]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d'];
  const categoryList = useMemo(() => Array.from(new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))), [transactions]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
        <CardDescription>The Wind Ring: Observe your financial patterns.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Monthly Income vs. Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categorySpending}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categorySpending.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <h3 className="text-lg font-semibold">Category Spending Trends (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={categoryTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {categoryList.map((category, index) => (
                <Line key={category} type="monotone" dataKey={category} stroke={COLORS[index % COLORS.length]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <h3 className="text-lg font-semibold">Productivity Metrics (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productivityMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit="%" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completionRate" name="Task Completion Rate" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportingSection;
