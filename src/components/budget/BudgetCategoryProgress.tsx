import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

interface BudgetCategoryProgressProps {
  category: string;
  spent: number;
  budgeted: number;
}

export default function BudgetCategoryProgress({ category, spent, budgeted }: BudgetCategoryProgressProps) {
  const progress = budgeted > 0 ? (spent / budgeted) * 100 : 0;
  const isOverBudget = spent > budgeted;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-medium">
        <span>{category}</span>
        <span className={isOverBudget ? 'text-red-500' : 'text-muted-foreground'}>
          {formatCurrency(spent)} / {formatCurrency(budgeted)}
        </span>
      </div>
      <Progress value={progress} className={isOverBudget ? '[&>div]:bg-red-500' : ''} />
    </div>
  );
}
