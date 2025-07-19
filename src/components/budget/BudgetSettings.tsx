import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const expenseCategories = [
  'Housing', 'Transportation', 'Food', 'Utilities', 'Healthcare',
  'Entertainment', 'Shopping', 'Education', 'Savings', 'Other'
];

interface BudgetSettingsProps {
  month: string; // Format: YYYY-MM
}

export default function BudgetSettings({ month }: BudgetSettingsProps) {
  const [budgets, setBudgets] = useState<Record<string, string>>({});

  const currentBudgets = useLiveQuery(() => 
    db.budgets.where('month').equals(month).toArray(),
    [month]
  );

  useEffect(() => {
    if (currentBudgets) {
      const budgetMap = currentBudgets.reduce((acc, budget) => {
        acc[budget.category] = String(budget.amount);
        return acc;
      }, {} as Record<string, string>);
      setBudgets(budgetMap);
    }
  }, [currentBudgets]);

  const handleBudgetChange = (category: string, amount: string) => {
    setBudgets(prev => ({ ...prev, [category]: amount }));
  };

  const handleSaveBudgets = async () => {
    try {
      for (const category of expenseCategories) {
        const amount = parseFloat(budgets[category]) || 0;
        
        const existingBudget = await db.budgets
          .where({ month, category })
          .first();

        if (existingBudget) {
          if (amount > 0) {
            await db.budgets.update(existingBudget.id!, { amount });
          } else {
            await db.budgets.delete(existingBudget.id!); // Remove if budget is set to 0
          }
        } else if (amount > 0) {
          await db.budgets.add({
            category,
            month,
            amount,
            createdAt: new Date(),
          });
        }
      }
      toast({ title: 'Budgets Saved', description: `Budgets for ${month} have been updated.` });
    } catch (error) {
      console.error('Failed to save budgets:', error);
      toast({ title: 'Error', description: 'Failed to save budgets.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Set Budgets for {month}</h3>
      <div className="space-y-2">
        {expenseCategories.map(category => (
          <div key={category} className="flex items-center justify-between">
            <Label htmlFor={`budget-${category}`}>{category}</Label>
            <Input
              id={`budget-${category}`}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-32"
              value={budgets[category] || ''}
              onChange={e => handleBudgetChange(category, e.target.value)}
            />
          </div>
        ))}
      </div>
      <Button onClick={handleSaveBudgets} className="w-full">Save Budgets</Button>
    </div>
  );
}
