import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, FormEvent } from "react";
import { addTransaction, db, Goal } from "@/lib/database";
import { useLiveQuery } from 'dexie-react-hooks';
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
}

export default function AddTransactionModal({ isOpen, onClose, onTransactionAdded }: AddTransactionModalProps) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    endDate: '',
    goalId: ''
  });

  const financialGoals = useLiveQuery<Goal[]>(() => 
    db.goals.where('category').equals('financial').toArray()
  );

  const expenseCategories = [
    'Housing', 'Transportation', 'Food', 'Utilities', 'Healthcare',
    'Entertainment', 'Shopping', 'Education', 'Savings', 'Other'
  ];

  const incomeCategories = [
    'Salary', 'Freelance', 'Business', 'Investments', 'Gifts', 'Other'
  ];

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isRecurring) {
        await db.recurringTransactions.add({
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          description: formData.description,
          startDate: new Date(formData.date),
          frequency: formData.frequency,
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          nextDueDate: new Date(formData.date), // First due date is the start date
          isActive: true,
          createdAt: new Date(),
        });
      } else {
        await addTransaction({
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          description: formData.description,
          date: new Date(formData.date),
          goalId: formData.goalId ? parseInt(formData.goalId, 10) : undefined
        });
      }

      toast({
        title: "Transaction Added",
        description: `Your ${formData.type} has been recorded successfully.`,
      });

      // Reset form
      setIsRecurring(false);
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        frequency: 'monthly',
        endDate: '',
        goalId: ''
      });

      onTransactionAdded();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-zenith bg-clip-text text-transparent">
            Record Transaction
          </DialogTitle>
          <DialogDescription>
            Track your financial flow with mindful awareness. Every transaction shapes your path.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'income' | 'expense') => 
                  setFormData(prev => ({ ...prev, type: value, category: '' }))
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'income' && financialGoals && financialGoals.length > 0 && (
            <div>
              <Label htmlFor="goal">Link to Financial Goal (Optional)</Label>
              <Select
                value={formData.goalId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, goalId: value }))}
              >
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Select a goal to contribute to" />
                </SelectTrigger>
                <SelectContent>
                  {financialGoals.map((goal) => (
                    <SelectItem key={goal.id} value={String(goal.id!)}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="recurring-switch" checked={isRecurring} onCheckedChange={setIsRecurring} />
            <Label htmlFor="recurring-switch">This is a recurring transaction</Label>
          </div>

          {isRecurring && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="zenith">
              Record Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}