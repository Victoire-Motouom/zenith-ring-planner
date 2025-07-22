import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight, Pencil, Trash2, Target, Activity } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Transaction, deleteTransaction } from "@/lib/database";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from '@/lib/utils';
import AddTransactionModal from "./AddTransactionModal";
import EditTransactionModal from "./EditTransactionModal";
import BudgetSettings from './BudgetSettings';
import BudgetCategoryProgress from './BudgetCategoryProgress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface MonthlyStats {
  income: number;
  expenses: number;
  balance: number;
}

type ExpensesByCategory = {
  [key: string]: number;
};

export default function BudgetOverview() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetSettingsOpen, setIsBudgetSettingsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const { toast } = useToast();
  
  // Get transactions for the current month
  const transactions = useLiveQuery(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return db.transactions
      .where('date')
      .between(startOfMonth, endOfMonth)
      .toArray();
  }, []);

  // Get budgets for the current month
  const budgets = useLiveQuery(async () => {
    return db.budgets.toArray();
  }, []);
  
  // Calculate monthly stats
  const monthlyStats: MonthlyStats = useMemo(() => {
    const stats: MonthlyStats = { income: 0, expenses: 0, balance: 0 };
    
    if (transactions) {
      transactions.forEach(t => {
        if (t.type === 'income') {
          stats.income += t.amount;
        } else {
          stats.expenses += t.amount;
        }
      });
      stats.balance = stats.income - stats.expenses;
    }
    
    return stats;
  }, [transactions]);
  
  // Calculate expenses by category
  const expensesByCategory = useMemo(() => {
    const result: ExpensesByCategory = {};
    
    if (transactions) {
      transactions.forEach(t => {
        if (t.type === 'expense') {
          result[t.category] = (result[t.category] || 0) + t.amount;
        }
      });
    }
    
    return result;
  }, [transactions]);
  
  // Handle transaction deletion
  const handleDeleteTransaction = useCallback(async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handlePrevMonth = useCallback(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const newDate = new Date(year, month - 2, 1);
    setCurrentMonth(newDate.toISOString().slice(0, 7));
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const newDate = new Date(year, month, 1);
    setCurrentMonth(newDate.toISOString().slice(0, 7));
  }, [currentMonth]);

  // Calculate budget summary
  const totalBudget = useMemo(() => 
    budgets?.reduce((sum, b) => sum + b.amount, 0) ?? 0, 
    [budgets]
  );
  
  const totalExpenses = monthlyStats.expenses;
  const remainingBudget = totalBudget - totalExpenses;
  const netFlow = monthlyStats.income - monthlyStats.expenses;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold bg-gradient-zenith bg-clip-text text-transparent">
          Budget Overview
        </h2>

        {/* Month Navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-36 text-center">
            {new Date(`${currentMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Dialog open={isBudgetSettingsOpen} onOpenChange={setIsBudgetSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Manage Budgets
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Budget Settings</DialogTitle>
              </DialogHeader>
              <BudgetSettings month={currentMonth} />
            </DialogContent>
          </Dialog>
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Budget Category Progress */}
      <Card className="w-full">
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
            <p className="text-sm text-muted-foreground">
              No budgets set for this month. Click 'Manage Budgets' to add some.
            </p>
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
            <div className="space-y-4">
              {transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                          {transaction.category && ` • ${transaction.category}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-foreground'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTransaction(transaction)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTransactionAdded={() => {
          // The modal will handle the refresh internally
        }}
      />
      
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={() => {
            // The modal will handle the refresh internally
          }}
        />
      )}
    </div>
  );
}