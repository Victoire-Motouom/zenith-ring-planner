import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task } from '@/lib/database';
import { toast } from '@/hooks/use-toast';

interface AddTimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
}

export default function AddTimeSlotModal({ isOpen, onClose, date }: AddTimeSlotModalProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [linkedTaskId, setLinkedTaskId] = useState<number | undefined>(undefined);

  const tasksForDay = useLiveQuery(() => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return db.tasks.where('date').between(dayStart, dayEnd, true, true).toArray();
  }, [date]);

  const resetForm = () => {
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setLinkedTaskId(undefined);
  };

  const handleSave = async () => {
    if (!title || !startTime || !endTime) {
      toast({ title: 'Error', description: 'Please fill in all time slot details.', variant: 'destructive' });
      return;
    }

    try {
      await db.timeSlots.add({
        title,
        startTime,
        endTime,
        date,
        taskId: linkedTaskId,
        createdAt: new Date(),
      });
      toast({ title: 'Success', description: 'Time slot created.' });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save time slot:', error);
      toast({ title: 'Error', description: 'Failed to save time slot.', variant: 'destructive' });
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
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
