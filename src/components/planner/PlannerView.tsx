import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ChevronLeft, ChevronRight, Clock, Target, Zap, Calendar } from 'lucide-react';
import AddTimeSlotModal from '@/components/planner/AddTimeSlotModal';
import DraggableTimeSlot from './DraggableTimeSlot';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task, TimeSlot } from '@/lib/database';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Type for drag and drop result
interface DropResult {
  draggableId: string;
  type: string;
  reason: string;
  source: {
    index: number;
    droppableId: string;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
}

// Mock components for when react-beautiful-dnd fails to load
const MockDragDropContext = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const MockDroppable = ({ children }: { children: (provided: any) => React.ReactNode }) => (
  <div>{children({})}</div>
);

// Use dynamic import with error boundary
let DragDropContext: React.ComponentType<any> = MockDragDropContext;
let Droppable: React.ComponentType<any> = MockDroppable;

// Try to load react-beautiful-dnd
const loadRBD = async () => {
  try {
    const rbd = await import('react-beautiful-dnd');
    DragDropContext = rbd.DragDropContext;
    Droppable = rbd.Droppable;
  } catch (e) {
    console.warn('react-beautiful-dnd failed to load, using mock components', e);
  }
};

const PlannerView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const dateString = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD

  const handleDateChange = (direction: 'prev' | 'next') => {
    setSelectedDate(current => {
      const newDate = new Date(current);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const timeSlotsWithTasks = useLiveQuery(async (): Promise<(TimeSlot & { task?: Task })[]> => {
    if (!db) return [];
    const slots = await db.timeSlots
      .where('date')
      .equals(dateString)
      .sortBy('order');
      
    const slotsWithTasks = await Promise.all(
      slots.map(async (slot) => {
        const task: Task | undefined = slot.taskId ? await db.tasks.get(slot.taskId) : undefined;
        return { ...slot, task };
      })
    );
    return slotsWithTasks;
  }, [dateString]);

  const completedSlots = timeSlotsWithTasks?.filter(slot => slot.completed === true).length || 0;
  const totalSlots = timeSlotsWithTasks?.length || 0;
  const productivityRate = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  // Function to delete a time slot
  const handleDeleteTimeSlot = useCallback(async (slotId: string) => {
    try {
      await db.timeSlots.delete(slotId);
      toast({
        title: 'Time slot deleted',
        description: 'Successfully deleted time slot',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete time slot',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleToggleComplete = useCallback(async (id: number, completed: boolean) => {
    try {
      await db.timeSlots.update(id, { completed });
    } catch (error) {
      console.error('Failed to update time slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to update time slot status.',
        variant: 'destructive'
      });
    }
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    if (source.index === destination.index) return;

    try {
      const slots = timeSlotsWithTasks || [];
      const newSlots = Array.from(slots);
      const [removed] = newSlots.splice(source.index, 1);
      newSlots.splice(destination.index, 0, removed);
      
      // Update the order in the database
      await db.transaction('rw', db.timeSlots, async () => {
        for (let i = 0; i < newSlots.length; i++) {
          const slot = newSlots[i];
          if (slot.id) {
            await db.timeSlots.update(slot.id, { order: i });
          }
        }
      });
    } catch (error) {
      console.error('Failed to reorder time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder time slots. Please try again.',
        variant: 'destructive'
      });
    }
  }, [timeSlotsWithTasks]);

  const handleEditTimeSlot = useCallback((slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  }, []);

  const handleSaveTimeSlot = useCallback(() => {
    // This will trigger a refresh of the time slots
    setSelectedSlot(null);
  }, []);

  // Removed renderTimeSlot since we're inlining the DraggableTimeSlot component usage

  return (
    <div className="space-y-6">
      {/* ZEP Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Zenith Enhancement Planner</h2>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Time Slot
          </Button>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => handleDateChange('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={() => handleDateChange('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSlots}</div>
            <p className="text-xs text-muted-foreground">Total scheduled for today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSlots}</div>
            <p className="text-xs text-muted-foreground">Tasks completed today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productivityRate}%</div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeSlotsWithTasks?.reduce((total, slot) => {
                const [startH, startM] = slot.startTime.split(':').map(Number);
                const [endH, endM] = slot.endTime.split(':').map(Number);
                const duration = (endH * 60 + endM) - (startH * 60 + startM);
                return total + duration;
              }, 0) || 0} min
            </div>
            <p className="text-xs text-muted-foreground">Total focused work time</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Slots List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="time-slots">
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {timeSlotsWithTasks && timeSlotsWithTasks.length > 0 ? (
                    timeSlotsWithTasks
                      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.startTime.localeCompare(b.startTime))
                      .map((slot, index) => (
                        <DraggableTimeSlot
                          key={slot.id}
                          timeSlot={slot}
                          index={index}
                          onDelete={handleDeleteTimeSlot}
                          onEdit={handleEditTimeSlot}
                        />
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-1">No time slots scheduled</h3>
                      <p className="text-sm text-muted-foreground">
                        Add a time slot to get started with your day
                      </p>
                      <Button 
                        className="mt-4" 
                        variant="outline" 
                        onClick={() => setIsModalOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Time Slot
                      </Button>
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      <AddTimeSlotModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
        }}
        date={dateString}
        initialData={selectedSlot || undefined}
        onSave={handleSaveTimeSlot}
      />
    </div>
  );
};

export default PlannerView;
