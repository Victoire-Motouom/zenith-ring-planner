import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Target, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/database";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from '@/lib/utils';
import AddTransactionModal from "./AddTransactionModal";
import BudgetSettings from './BudgetSettings';
import BudgetCategoryProgress from './BudgetCategoryProgress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function BudgetOverview() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isBudgetSettingsOpen, setIsBudgetSettingsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

  const transactions = useLiveQuery(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return db.transactions 
      .where('date')
      .between(startOfMonth, endOfMonth)
      .toArray();
  }, []);

  const monthlyStats = transactions?.reduce((stats, t) => {
    if (t.type === 'income') {
      stats.income += t.amount;
    } else {
      stats.expenses += t.amount;
    }
    stats.balance = stats.income - stats.expenses;
    return stats;
  }, { income: 0, expenses: 0, balance: 0 }) || { income: 0, expenses: 0, balance: 0 };

  const budgets = useLiveQuery(() => 
    db.budgets.where('month').equals(currentMonth).toArray(),
    [currentMonth]
  );

  const totalBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) ?? 0;
  const totalExpenses = monthlyStats.expenses;
  const remainingBudget = totalBudget - totalExpenses;
  const netFlow = monthlyStats.income - monthlyStats.expenses;

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(`${currentMonth}-02`); // Use day 2 to avoid timezone/month-end issues
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentMonth(currentDate.toISOString().slice(0, 7));
  };

  const expensesByCategory = transactions
    ?.filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-zenith bg-clip-text text-transparent">
          Budget Overview
        </h2>

        {/* Month Navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-36 text-center">
            {new Date(`${currentMonth}-02`).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Dialog open={isBudgetSettingsOpen} onOpenChange={setIsBudgetSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Manage Budgets</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Budget Settings</DialogTitle>
              </DialogHeader>
              <BudgetSettings month={currentMonth} />
            </DialogContent>
          </Dialog>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBudget)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
              {formatCurrency(remainingBudget)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
              {formatCurrency(netFlow)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-earth-ring" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-earth-ring">
              {formatCurrency(monthlyStats.income)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Foundation of prosperity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-fire-ring" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fire-ring">
              {formatCurrency(monthlyStats.expenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Energy directed outward
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-water-ring" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyStats.balance >= 0 ? 'text-water-ring' : 'text-fire-ring'}`}>
              {formatCurrency(monthlyStats.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Flow of resources
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Category Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Category Budgets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgets && budgets.length > 0 ? (
              budgets.map(budget => (
                <BudgetCategoryProgress
                  key={budget.category}
                  category={budget.category}
                  spent={expensesByCategory?.[budget.category] || 0}
                  budgeted={budget.amount}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No budgets set for this month. Click 'Manage Budgets' to add some.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet. Start by adding your first transaction.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...transactions].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'income' ? 'text-earth-ring' : 'text-fire-ring'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTransactionAdded={() => {
          // No longer need to manually refresh, useLiveQuery handles it.
          // We can add a toast message for better user feedback.
          toast({ title: "Success", description: "Transaction added successfully." });
        }}
      />
    </div>
  );
}