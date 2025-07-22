import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RecurrenceSettings } from './RecurrenceSettings';
import { db, Task, TimeSlot, RecurrenceRule, RecurrenceRuleWithDate, toRecurrenceRule, fromRecurrenceRule } from '@/lib/database';
import { generateRecurringTimeSlots } from '@/lib/recurrence';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Clock } from 'lucide-react';

interface AddTimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  initialData?: TimeSlot | null;
  onSave: () => void;
}

export default function AddTimeSlotModal({ isOpen, onClose, date, initialData, onSave }: AddTimeSlotModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '10:00');
  const [linkedTaskId, setLinkedTaskId] = useState<number | undefined>(initialData?.taskId);
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRuleWithDate | undefined>(
    initialData?.recurrenceRule 
      ? fromRecurrenceRule(initialData.recurrenceRule)
      : {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [new Date().getDay()],
        }
  );

  const handleRecurrenceChange = (rule: RecurrenceRuleWithDate) => {
    setRecurrenceRule(rule);
  };
  
  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      setLinkedTaskId(initialData.taskId);
    } else {
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      setLinkedTaskId(undefined);
    }
  }, [initialData]);

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
    if (!startTime || !endTime) return null;
    return checkTimeConflict(startTime, endTime);
  }, [startTime, endTime, existingTimeSlots]);

  // Function to delete conflicting slot
  const deleteConflictingSlot = async () => {
    if (currentConflict?.conflictingSlot?.id) {
      try {
        await db.timeSlots.delete(currentConflict.conflictingSlot.id);
        toast({ 
          title: 'Conflicting Slot Deleted', 
          description: `Deleted "${currentConflict.conflictingSlot.title}" to resolve conflict.`,
          variant: 'default'
        });
      } catch (error) {
        console.error('Failed to delete conflicting slot:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to delete conflicting slot.', 
          variant: 'destructive' 
        });
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setLinkedTaskId(undefined);
  };

  const handleSave = async (forceOverride = false, isRecurringSave: boolean = false) => {
    if (!title || !startTime || !endTime) {
      toast({ title: 'Error', description: 'Please fill in all time slot details.', variant: 'destructive' });
      return;
    }

    // Convert recurrence rule to database format
    const dbRecurrenceRule = recurrenceRule ? toRecurrenceRule(recurrenceRule) : undefined;

    // Check for time conflicts (unless forcing override)
    if (!forceOverride) {
      type SlotCheck = { id?: number; startTime: string; endTime: string; date: string };
      const slotsToCheck: SlotCheck[] = [];
      
      if (isRecurring && recurrenceRule) {
        // For recurring slots, we'll check conflicts for each generated instance
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // Check 3 months ahead for conflicts
        
        const recurringSlots = generateRecurringTimeSlots(
          {
            title,
            startTime,
            endTime,
            date,
            taskId: linkedTaskId,
            completed: initialData?.completed || false,
            order: initialData?.order || 0,
            isRecurring: true,
            isInstance: false,
            parentId: initialData?.id,
            description,
            category,
          },
          recurrenceRule,
          endDate
        );
        
        slotsToCheck.push(...recurringSlots);
      } else {
        // For single time slot
        slotsToCheck.push({
          id: initialData?.id,
          startTime,
          endTime,
          date,
        });
      }

      // Check for conflicts with existing time slots
      const hasConflict = await Promise.all(
        slotsToCheck.map(async (slot) => {
          const conflictingSlots = await db.timeSlots
            .where('date')
            .equals(slot.date)
            .and((existingSlot: TimeSlot) => {
              if (initialData?.id && existingSlot.id === initialData.id) return false;
              return timeRangesOverlap(
                slot.startTime,
                slot.endTime,
                existingSlot.startTime,
                existingSlot.endTime
              );
            })
            .toArray();
          return conflictingSlots.length > 0;
        })
      ).then(results => results.some(hasConflict => hasConflict));

      if (hasConflict) {
        toast({
          title: 'Time Conflict',
          description: 'One or more time slots overlap with existing ones. Please choose different times or enable "Force Save" to override.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    try {

      // Create base time slot data with proper types
      const timeSlotData: Omit<TimeSlot, 'id' | 'createdAt'> = {
        title,
        startTime,
        endTime,
        date,
        description,
        category,
        taskId: linkedTaskId,
        completed: initialData?.completed || false,
        order: initialData?.order || 0,
        isRecurring,
        recurrenceRule: dbRecurrenceRule,
        parentId: initialData?.parentId,
        isInstance: false,
      };
      
      if (initialData?.id) {
        // Update existing time slot
        await db.timeSlots.update(initialData.id, timeSlotData);
        
        // If this is a recurring event and the recurrence rule changed, update all future instances
        if (isRecurring && recurrenceRule) {
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1); // 1 year ahead
          
          const recurringSlots = generateRecurringTimeSlots(
            {
              ...timeSlotData,
              id: initialData.id,
            },
            recurrenceRule,
            endDate
          );
          
          // Remove existing instances and create new ones
          await db.timeSlots
            .where('parentId')
            .equals(initialData.id)
            .delete();
            
          await db.timeSlots.bulkAdd(
            recurringSlots.map(slot => ({
              ...slot,
              createdAt: new Date(),
              isInstance: true,
              parentId: initialData.id,
            }))
          );
        }
        
        toast({
          title: 'Time slot updated',
          description: isRecurring 
            ? 'Your recurring time slot has been updated.'
            : 'Your time slot has been updated.',
          variant: 'default',
        });
      } else {
        if (isRecurring && recurrenceRule) {
          // Create a new recurring series
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1); // 1 year ahead
          
          // Create parent slot with proper types
          const parentSlot: TimeSlot = {
            ...timeSlotData,
            id: undefined, // Will be set by the database
            createdAt: new Date(),
            isInstance: false,
            parentId: undefined,
          };
          
          // Add the parent slot with type assertion
          const parentId = await db.timeSlots.add(parentSlot as TimeSlot);
          
          // Generate and add recurring instances
          const recurringSlots = generateRecurringTimeSlots(
            {
              ...parentSlot,
              id: parentId,
            },
            recurrenceRule,
            endDate
          );
          
          // Add recurring instances with proper typing
          await db.timeSlots.bulkAdd(
            recurringSlots.map(slot => ({
              ...slot,
              id: undefined, // Let the database assign IDs
              createdAt: new Date(),
              isInstance: true,
              parentId: parentId as number,
            } as TimeSlot))
          );
          
          toast({
            title: 'Recurring time slot added',
            description: `Your time slot has been scheduled to repeat ${recurrenceRule.frequency === 'weekdays' ? 'on weekdays' : recurrenceRule.frequency} for the next year.`,
            variant: 'default',
          });
        } else {
          // Create a single time slot
          await db.timeSlots.add({
            ...timeSlotData,
            createdAt: new Date(),
          });
          
          toast({
            title: 'Time slot added',
            description: 'Your time slot has been scheduled.',
            variant: 'default',
          });
        }
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save time slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to save time slot. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Time Slot</DialogTitle>
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
