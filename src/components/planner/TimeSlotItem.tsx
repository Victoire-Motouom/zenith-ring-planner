import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeSlotItemProps = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  category?: string;
  completed: boolean;
  onDelete: (id: number, title: string) => void;
  onToggleComplete: (id: number, completed: boolean) => void;
  onEdit: () => void;
};

export default function TimeSlotItem({
  id,
  title,
  startTime,
  endTime,
  description,
  category,
  completed,
  onDelete,
  onToggleComplete,
  onEdit,
}: TimeSlotItemProps) {
  return (
    <div className={cn(
      'flex items-center space-x-4 p-4 border rounded-lg transition-colors',
      completed ? 'bg-muted/50' : 'bg-card',
    )}>
      <Checkbox
        id={`completed-${id}`}
        checked={completed}
        onCheckedChange={(checked) => onToggleComplete(id, checked as boolean)}
        className="h-5 w-5 rounded-full"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            'font-medium text-sm sm:text-base truncate',
            completed && 'line-through text-muted-foreground'
          )}>
            {title}
          </h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {startTime} - {endTime}
          </span>
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}
        
        {category && (
          <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
            {category}
          </span>
        )}
      </div>
      
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(id, title)}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}
