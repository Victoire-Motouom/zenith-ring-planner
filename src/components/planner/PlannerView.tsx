import { useState, useMemo, lazy, Suspense, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ChevronLeft, ChevronRight, Clock, Target, Zap } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db, TimeSlot } from '@/lib/database';
import { toast } from '@/hooks/use-toast';

// Lazy load the AddTimeSlotModal component
const AddTimeSlotModal = lazy(() => import('./AddTimeSlotModal'));

// Type for time slot with optional task
interface TimeSlotWithTask extends TimeSlot {
  task?: any; // Simplified for now, should be properly typed
}

// DraggableTimeSlot and TimeSlotsList are not used for now, so we omit them for clarity

function TimeSlotsList({ timeSlots, onEdit, onDelete }: {
  timeSlots: TimeSlotWithTask[];
  onEdit: (slot: TimeSlotWithTask) => void;
  onDelete: (id: number) => void;
}) {
  if (!timeSlots.length) {
    return <div className="text-muted-foreground text-center py-4">No time slots planned for today.</div>;
  }
  return (
    <div className="space-y-2">
      {timeSlots.map((slot: TimeSlotWithTask) => (
        <div key={slot.id} className="flex items-center justify-between border rounded p-2">
          <div>
            <div className="font-medium">{slot.startTime} - {slot.endTime}</div>
            <div className="text-sm text-muted-foreground">{slot.title}</div>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(slot)}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(slot.id as number)}>Delete</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PlannerView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Format the current date as YYYY-MM-DD for database queries
  const dateString = format(currentDate, 'yyyy-MM-dd');

  // Fetch time slots for the current date
  const timeSlots = useLiveQuery(
    () => db.timeSlots.where('date').equals(dateString).toArray(),
    [dateString]
  );

  // Combine time slots with task data (simplified for now)
  const timeSlotsWithTasks = useMemo(() => {
    if (!timeSlots) return [];
    return timeSlots.map(slot => ({
      ...slot,
      task: undefined
    }));
  }, [timeSlots]);

  // Calculate total planned time, completed slots, and productivity rate
  const totalPlannedMinutes = useMemo(() => {
    if (!timeSlots) return 0;
    return timeSlots.reduce((total, slot) => {
      const start = new Date(`2000-01-01T${slot.startTime}:00`);
      const end = new Date(`2000-01-01T${slot.endTime}:00`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      return total + duration;
    }, 0);
  }, [timeSlots]);

  const completedSlots = useMemo(() => {
    if (!timeSlots) return 0;
    return timeSlots.filter(slot => slot.completed).length;
  }, [timeSlots]);

  const totalSlots = timeSlots?.length || 0;
  const productivityRate = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  // Set isClient to true after component mounts (to avoid hydration issues)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Navigation handlers
  const goToPreviousDay = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  // Time slot handlers
  const handleAddTimeSlot = () => {
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  // Fix handleEditTimeSlot and handleDeleteTimeSlot to use String(slot.id) if needed
  const handleEditTimeSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleDeleteTimeSlot = async (id: number) => {
    try {
      await db.timeSlots.delete(id);
      toast({
        title: 'Time slot deleted',
        description: 'The time slot has been removed from your schedule.',
      });
    } catch (error) {
      console.error('Failed to delete time slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the time slot. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveTimeSlot = async (timeSlot: Omit<TimeSlot, 'id' | 'date' | 'order'>) => {
    try {
      if (selectedSlot) {
        // Update existing time slot
        await db.timeSlots.update(String(selectedSlot.id), timeSlot);
        toast({
          title: 'Time slot updated',
          description: 'Your changes have been saved.',
        });
      } else {
        // Create new time slot
        const order = timeSlots?.length || 0;
        await db.timeSlots.add({
          ...timeSlot,
          date: dateString,
          order: Number(order), // Ensure order is a number
          completed: false,
        });
        toast({
          title: 'Time slot added',
          description: 'The new time slot has been added to your schedule.',
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save time slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the time slot. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Don't render anything on the server to avoid hydration issues
  if (!isClient) {
    return null;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Planner</h1>
          <p className="text-muted-foreground">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddTimeSlot}>
            <Plus className="mr-2 h-4 w-4" />
            Add Time Slot
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Planned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m
            </div>
            <p className="text-xs text-muted-foreground">
              {totalSlots} time slot{totalSlots !== 1 ? 's' : ''} planned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSlots}</div>
            <p className="text-xs text-muted-foreground">
              {totalSlots > 0 ? `${productivityRate}% productivity` : 'No tasks yet'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productivityRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedSlots} of {totalSlots} tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Slots List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading schedule...</div>}>
            <TimeSlotsList 
              timeSlots={timeSlotsWithTasks} 
              onEdit={handleEditTimeSlot}
              onDelete={handleDeleteTimeSlot}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Add/Edit Time Slot Modal */}
      <Suspense fallback={null}>
        <AddTimeSlotModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlot(null);
          }}
          onSave={handleSaveTimeSlot}
          initialData={selectedSlot}
          date={dateString}
        />
      </Suspense>
    </div>
  );
}
