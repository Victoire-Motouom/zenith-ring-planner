import { useState, useEffect } from 'react';
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
import { db, Transaction } from "@/lib/database";
import { format } from 'date-fns';
import { toast } from "@/hooks/use-toast";

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onTransactionUpdated: () => void;
}

export default function EditTransactionModal({ 
  transaction, 
  isOpen, 
  onClose, 
  onTransactionUpdated 
}: EditTransactionModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Math.abs(transaction.amount).toString(),
        type: transaction.amount >= 0 ? 'income' : 'expense',
        category: transaction.category,
        description: transaction.description || '',
        date: format(transaction.date, 'yyyy-MM-dd'),
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;
    
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid number for the amount.",
          variant: "destructive",
        });
        return;
      }

      await db.transactions.update(transaction.id!, {
        amount: formData.type === 'income' ? amount : -amount,
        category: formData.category,
        description: formData.description,
        date: new Date(formData.date),
      });

      toast({
        title: "Transaction Updated",
        description: "The transaction has been updated successfully.",
      });

      onTransactionUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const expenseCategories = [
    'Housing', 'Transportation', 'Food', 'Utilities', 'Healthcare',
    'Entertainment', 'Shopping', 'Education', 'Savings', 'Other'
  ];

  const incomeCategories = [
    'Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'
  ];

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the transaction details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => 
                  setFormData(prev => ({ ...prev, type: value, category: '' }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                className="col-span-3"
                value={formData.amount}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, amount: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="col-span-3">
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                className="col-span-3"
                value={formData.date}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                className="col-span-3"
                value={formData.description}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
