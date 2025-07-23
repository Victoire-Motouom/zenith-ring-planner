import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RecurrenceSettings } from './RecurrenceSettings';
import { db, TimeSlot, Task, RecurrenceRuleWithDate, toRecurrenceRule, fromRecurrenceRule } from '@/lib/database';
import { generateRecurringTimeSlots } from '@/lib/recurrence';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Clock } from 'lucide-react';

interface ConflictInfo {
  show: boolean;
  conflicts: Array<{ slot: SlotCheck; conflict: any }>;
}

interface AddTimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timeSlot: TimeSlot) => Promise<void>;
  date: string;
  initialData?: TimeSlot | null;
}

type SlotCheck = { id?: number; startTime: string; endTime: string; date: string };

export default function AddTimeSlotModal({ isOpen, onClose, date, initialData, onSave }: AddTimeSlotModalProps) {
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '10:00');
  const [category, setCategory] = useState(initialData?.category || 'work');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  
  // UI state
  const [, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [_forceOverride, setForceOverride] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo>({ 
    show: false, 
    conflicts: [] 
  });
  
  // Data state
  const [linkedTaskId, setLinkedTaskId] = useState<number | undefined>(initialData?.taskId);
  const defaultRecurrenceRule: RecurrenceRuleWithDate = {
    frequency: 'weekly',
    interval: 1,
    count: undefined,
    endDate: undefined,
    daysOfWeek: [new Date(date).getDay()],
    exceptions: []
  } as RecurrenceRuleWithDate;

  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRuleWithDate>(
    initialData?.recurrenceRule 
      ? fromRecurrenceRule(initialData.recurrenceRule) 
      : defaultRecurrenceRule
  );

  const handleRecurrenceChange = useCallback((rule: Partial<RecurrenceRuleWithDate>) => {
    setRecurrenceRule(prev => ({
      ...prev,
      ...rule,
      daysOfWeek: rule.daysOfWeek || prev.daysOfWeek,
      exceptions: rule.exceptions || prev.exceptions
    }));
  }, []);

  // Convert RecurrenceRuleWithDate to RecurrenceRule for database
  const getRecurrenceRuleForDb = useCallback((rule: RecurrenceRuleWithDate) => {
    try {
      const result = toRecurrenceRule(rule);
      return result || undefined;
    } catch (error) {
      console.error('Error converting recurrence rule:', error);
      return undefined;
    }
  }, []);

  // Handle task link change - used in the Select component
  const handleTaskLinkChange = (value: string) => {
    setLinkedTaskId(value ? parseInt(value, 10) : undefined);
  };

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      onClose();
    }
  }, [onClose]);

  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      setCategory(initialData.category || 'work');
      setIsRecurring(initialData.isRecurring || false);
      setLinkedTaskId(initialData.taskId);
      if (initialData.recurrenceRule) {
        setRecurrenceRule(fromRecurrenceRule(initialData.recurrenceRule));
      }
    } else {
      setTitle('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('10:00');
      setCategory('work');
      setIsRecurring(false);
      setLinkedTaskId(undefined);
      setRecurrenceRule(defaultRecurrenceRule);
    }
    setError('');
    setForceOverride(false);
    setConflictInfo({ show: false, conflicts: [] });
  }, [initialData, date]);

  const tasksForDay = useLiveQuery(() => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return db.tasks.where('date').between(dayStart, dayEnd, true, true).toArray();
  }, [date]);

  const existingTimeSlots = useLiveQuery(() => {
    return db.timeSlots.where('date').equals(date).toArray();
  }, [date]);

  // Function to check if two time ranges overlap
  const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = timeToMinutes(end1);
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = timeToMinutes(end2);

    // Check if ranges overlap (start of one is before end of other and vice versa)
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
  };

  // Function to check for time conflicts and return conflicting slot
  const checkTimeConflict = (newStart: string, newEnd: string): { message: string; conflictingSlot?: any } | null => {
    if (!existingTimeSlots) return null;

    // Check if end time is after start time
    const startMinutes = parseInt(newStart.split(':')[0]) * 60 + parseInt(newStart.split(':')[1]);
    const endMinutes = parseInt(newEnd.split(':')[0]) * 60 + parseInt(newEnd.split(':')[1]);
    
    if (endMinutes <= startMinutes) {
      return { message: 'End time must be after start time' };
    }

    // Check for overlaps with existing time slots
    for (const slot of existingTimeSlots) {
      if (timeRangesOverlap(newStart, newEnd, slot.startTime, slot.endTime)) {
        return {
          message: `Time conflict with existing slot: "${slot.title}" (${slot.startTime} - ${slot.endTime})`,
          conflictingSlot: slot
        };
      }
    }

    return null;
  };

  // Function to find next available time slot
  const findNextAvailableTime = (): { start: string; end: string } | null => {
    if (!existingTimeSlots) return null;

    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const minutesToTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    // Get current duration
    const currentDuration = timeToMinutes(endTime) - timeToMinutes(startTime);
    if (currentDuration <= 0) return null;

    // Sort existing slots by start time
    const sortedSlots = [...existingTimeSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Try to find gap between existing slots
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentSlotEnd = timeToMinutes(sortedSlots[i].endTime);
      const nextSlotStart = timeToMinutes(sortedSlots[i + 1].startTime);
      const gapDuration = nextSlotStart - currentSlotEnd;

      if (gapDuration >= currentDuration) {
        return {
          start: minutesToTime(currentSlotEnd),
          end: minutesToTime(currentSlotEnd + currentDuration)
        };
      }
    }

    // If no gap found, suggest after the last slot
    if (sortedSlots.length > 0) {
      const lastSlotEnd = timeToMinutes(sortedSlots[sortedSlots.length - 1].endTime);
      if (lastSlotEnd + currentDuration <= 24 * 60) { // Don't go past midnight
        return {
          start: minutesToTime(lastSlotEnd),
          end: minutesToTime(lastSlotEnd + currentDuration)
        };
      }
    }

    // If no slots exist, suggest 9:00 AM
    if (sortedSlots.length === 0) {
      return {
        start: '09:00',
        end: minutesToTime(9 * 60 + currentDuration)
      };
    }

    return null;
  };

  // Real-time conflict checking
  const currentConflict = useMemo(() => {
    if (!startTime || !endTime || !existingTimeSlots) return null;
    return checkTimeConflict(startTime, endTime);
  }, [startTime, endTime, existingTimeSlots, checkTimeConflict]);

  // Function to delete conflicting slot
  const deleteConflictingSlot = useCallback(async () => {
    if (currentConflict?.conflictingSlot?.id) {
      try {
        await db.timeSlots.delete(currentConflict.conflictingSlot.id);
        toast({ 
          title: 'Conflicting Slot Deleted', 
          description: `Deleted "${currentConflict.conflictingSlot.title}" to resolve conflict.`,
          variant: 'default'
        });
        return true;
      } catch (error) {
        console.error('Failed to delete conflicting slot:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to delete conflicting slot.', 
          variant: 'destructive' 
        });
        return false;
      }
    }
    return false;
  }, [currentConflict]);

  // Reset form to default values
  const resetForm = useCallback(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setStartTime(initialData.startTime || '09:00');
      setEndTime(initialData.endTime || '10:00');
      setCategory(initialData.category || 'work');
      setIsRecurring(initialData.isRecurring || false);
      setLinkedTaskId(initialData.taskId);
      if (initialData.recurrenceRule) {
        setRecurrenceRule(fromRecurrenceRule(initialData.recurrenceRule));
      } else {
        setRecurrenceRule(defaultRecurrenceRule);
      }
    } else {
      setTitle('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('10:00');
      setCategory('work');
      setIsRecurring(false);
      setLinkedTaskId(undefined);
      setRecurrenceRule(defaultRecurrenceRule);
    }
  }, [initialData]);
  
  // Reset form when initialData or date changes
  useEffect(() => {
    resetForm();
  }, [initialData, date, resetForm]);

  const handleSave = async (forceOverride = false) => {
    if (!title || !startTime || !endTime) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    // Check if end time is after start time
    if (endTime <= startTime) {
      toast({ title: 'Error', description: 'End time must be after start time', variant: 'destructive' });
      return;
    }

    try {
      setIsSaving(true);
      
          // Prepare the time slot data
      const timeSlotData: Omit<TimeSlot, 'id'> & { updatedAt?: Date } = {
        title,
        description,
        startTime,
        endTime,
        date,
        category,
        isRecurring,
        taskId: linkedTaskId,
        recurrenceRule: isRecurring ? getRecurrenceRuleForDb(recurrenceRule) : undefined,
        parentId: initialData?.parentId,
        completed: initialData?.completed || false,
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Check for time conflicts (unless forcing override)
      if (!forceOverride) {
        const slotsToCheck: SlotCheck[] = [{
          id: initialData?.id,
          startTime,
          endTime,
          date
        }];

        // Check for conflicts with existing time slots
        const conflicts = await Promise.all(
          slotsToCheck.map(async (slot) => {
            const existingSlots = await db.timeSlots
              .where('date')
              .equals(slot.date)
              .filter(s => {
                return (
                  s.id !== slot.id && // Don't check against self
                  timeRangesOverlap(s.startTime, s.endTime, slot.startTime, slot.endTime)
                );
              })
              .toArray();
              
            return {
              slot,
              conflicts: existingSlots,
            };
          })
        );
        
        // Filter out slots with no conflicts
        const slotsWithConflicts = conflicts.filter(({ conflicts }) => conflicts.length > 0);
        
        if (slotsWithConflicts.length > 0) {
          setError('There are time conflicts with existing time slots');
          setConflictInfo({
            show: true,
            conflicts: slotsWithConflicts.flatMap(({ slot, conflicts }) => 
              conflicts.map(conflict => ({ slot, conflict }))
            )
          });
          return;
        }
      }

      if (initialData?.id) {
        // Update existing time slot
        await db.timeSlots.update(initialData.id, timeSlotData);
        // If this is a recurring event, update all future instances
        if (isRecurring && initialData.recurrenceRule) {
          const futureSlots = await db.timeSlots
            .where('parentId')
            .equals(initialData.id)
            .and(slot => new Date(slot.date) > new Date(date))
            .toArray();

          for (const slot of futureSlots) {
            await db.timeSlots.update(slot.id, {
              ...timeSlotData,
              date: slot.date,
              parentId: initialData.id,
              createdAt: slot.createdAt,
              completed: slot.completed,
            } as Omit<TimeSlot, 'id'>);
          }
        }
        toast({
          title: 'Time slot updated',
          description: 'Your time slot has been updated successfully.',
        });
      } else {
        // Only call onSave, let parent handle DB logic
        // Compose the time slot object
        const timeSlot: TimeSlot = {
          id: undefined,
          title,
          description,
          startTime,
          endTime,
          date,
          category,
          isRecurring,
          recurrenceRule: isRecurring ? {
            ...recurrenceRule,
            endDate: recurrenceRule?.endDate ? recurrenceRule.endDate.toISOString() : undefined
          } : undefined,
          taskId: linkedTaskId,
          completed: false,
          createdAt: new Date()
        };
        await onSave(timeSlot);
        toast({
          title: 'Time slot created',
          description: 'Your time slot has been created successfully.',
        });
        onClose();
        setIsSaving(false);
        return;
      }
      // For update, also call onSave to update parent state
      const timeSlot: TimeSlot = {
        id: initialData?.id,
        title,
        description,
        startTime,
        endTime,
        date,
        category,
        isRecurring,
        recurrenceRule: isRecurring ? {
          ...recurrenceRule,
          endDate: recurrenceRule?.endDate ? recurrenceRule.endDate.toISOString() : undefined
        } : undefined,
        taskId: linkedTaskId,
        completed: initialData?.completed || false,
        createdAt: initialData?.createdAt ? new Date(initialData.createdAt) : new Date()
      };
      await onSave(timeSlot);
      onClose();
    } catch (error) {
      console.error('Error saving time slot:', error);
      setError('An error occurred while saving the time slot. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px]"
        aria-describedby="time-slot-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Time Slot' : 'Add New Time Slot'}</DialogTitle>
          <p id="time-slot-dialog-description" className="sr-only">
            {initialData ? 'Edit an existing time slot' : 'Create a new time slot'}
          </p>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">Start Time</Label>
            <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">End Time</Label>
            <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="col-span-3" />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal"
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Recurring</Label>
            <div className="flex items-center space-x-2 col-span-3">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 text-zenith-600 focus:ring-zenith-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="text-sm text-gray-700">
                This is a recurring event
              </label>
            </div>
          </div>
          
          {isRecurring && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Recurrence</Label>
              <div className="col-span-3">
                <RecurrenceSettings
                  value={recurrenceRule}
                  onChange={handleRecurrenceChange}
                />
              </div>
            </div>
          )}
          {/* Time Conflict Warning */}
          {currentConflict && (
            <div className="col-span-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Time Conflict</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">{currentConflict?.message}</p>
            </div>
          )}

          {/* Existing Time Slots Preview */}
          {existingTimeSlots && existingTimeSlots.length > 0 && (
            <div className="col-span-4 p-3 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium text-sm">Existing Time Slots Today</span>
              </div>
              <div className="space-y-1">
                {existingTimeSlots
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((slot, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                    <span className="ml-2">{slot.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="task" className="text-right">Link Task</Label>
            <Select onValueChange={(value) => setLinkedTaskId(Number(value))} value={linkedTaskId?.toString()}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="(Optional) Select a task" />
              </SelectTrigger>
              <SelectContent>
                {tasksForDay?.map((task: Task) => (
                  <SelectItem key={task.id} value={task.id!.toString()}>{task.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {currentConflict ? (
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="secondary"
                onClick={() => {
                  // Auto-suggest next available time
                  const suggestedTime = findNextAvailableTime();
                  if (suggestedTime) {
                    setStartTime(suggestedTime.start);
                    setEndTime(suggestedTime.end);
                  }
                }}
              >
                Suggest Time
              </Button>
              {currentConflict?.conflictingSlot && (
                <Button 
                  variant="outline"
                  onClick={deleteConflictingSlot}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Delete Conflicting Slot
                </Button>
              )}
              <Button 
                onClick={() => handleSave(true)} 
                disabled={!title.trim()}
                variant="destructive"
              >
                Force Save
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => handleSave()} 
              disabled={!title.trim()}
            >
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
