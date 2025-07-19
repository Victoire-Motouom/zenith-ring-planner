import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Link } from 'lucide-react';
import AddTimeSlotModal from '@/components/planner/AddTimeSlotModal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task } from '@/lib/database';

const PlannerView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

    const dateString = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD

  const handleDateChange = (direction: 'prev' | 'next') => {
    setSelectedDate(current => {
      const newDate = new Date(current);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const timeSlotsWithTasks = useLiveQuery(async () => {
    const slots = await db.timeSlots.where('date').equals(dateString).sortBy('startTime');
    const tasks = await db.tasks.toArray();
    const taskMap = new Map<number, Task>(tasks.map(t => [t.id!, t]));

    return slots.map(slot => ({
      ...slot,
      task: slot.taskId ? taskMap.get(slot.taskId) : undefined,
    }));
  }, [dateString]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="p-4 md:p-6">
            <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-zenith bg-clip-text text-transparent">Daily Time Planner</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleDateChange('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-48 text-center">
            {selectedDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={() => handleDateChange('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Time Slot
        </Button>
      </header>

      <div className="relative grid grid-cols-[auto_1fr] gap-x-4">
        {/* Hour markers */}
        {hours.map(hour => (
          <div key={hour} className="relative text-right -top-3">
            <span className="text-sm text-muted-foreground">{`${hour.toString().padStart(2, '0')}:00`}</span>
          </div>
        ))}

        {/* Timeline grid */}
        <div className="col-start-2 grid grid-rows-24 border-l border-border">
          {hours.map(hour => (
            <div key={hour} className="h-16 border-t border-border -ml-4 pl-4"></div>
          ))}
        </div>

                {/* Rendered Time Slots */}
        <div className="col-start-2 row-start-1 relative">
          {timeSlotsWithTasks?.map(slot => {
            const start = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
            const end = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
            const top = (start / 60) * 64; // 64px per hour
            const height = ((end - start) / 60) * 64;

            return (
              <div 
                key={slot.id}
                className="absolute w-full p-2 rounded-lg bg-primary/20 border border-primary/50 text-primary-foreground overflow-hidden"
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                                <p className="font-bold text-sm truncate">{slot.title}</p>
                <p className="text-xs text-primary/80">{`${slot.startTime} - ${slot.endTime}`}</p>
                {slot.task && (
                  <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-primary/20">
                    <Link className="h-3 w-3 text-primary/80" />
                    <p className="text-xs font-medium text-primary/90 truncate">{slot.task.title}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AddTimeSlotModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        date={dateString} 
      />
    </div>
  );
};

export default PlannerView;
