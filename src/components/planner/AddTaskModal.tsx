import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useState } from "react";
import { addTask } from "@/lib/database";
import { toast } from "@/hooks/use-toast";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  selectedDate: Date;
}

export default function AddTaskModal({ isOpen, onClose, onTaskAdded, selectedDate }: AddTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    ring: 'earth' as 'earth' | 'water' | 'fire' | 'wind' | 'void',
    timeSlot: '',
    category: ''
  });

  const rings = [
    { value: 'earth', label: 'Earth Ring - Foundation & Discipline', description: 'Core habits, financial planning, health basics' },
    { value: 'water', label: 'Water Ring - Adaptability & Flow', description: 'Flexible tasks, creative work, problem-solving' },
    { value: 'fire', label: 'Fire Ring - Decisive Action', description: 'Important decisions, goal pursuit, bold moves' },
    { value: 'wind', label: 'Wind Ring - Observation & Learning', description: 'Study, research, skill development, reflection' },
    { value: 'void', label: 'Void Ring - Intuition & Insight', description: 'Meditation, strategic thinking, innovation' }
  ];

  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addTask({
        title: formData.title,
        description: formData.description,
        completed: false,
        priority: formData.priority,
        ring: formData.ring,
        date: selectedDate,
        timeSlot: formData.timeSlot || undefined,
        category: formData.category || undefined
      });

      toast({
        title: "Task Created",
        description: `Your ${formData.ring} ring task has been added to your daily strategy.`,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        ring: 'earth',
        timeSlot: '',
        category: ''
      });

      onTaskAdded();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-water bg-clip-text text-transparent">
            Create Strategic Task
          </DialogTitle>
          <DialogDescription>
            Align your actions with the wisdom of the Five Rings. Each task belongs to a ring of mastery.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="What needs to be accomplished?"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              placeholder="e.g., Work, Personal, Health"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="ring">Wisdom Ring</Label>
            <Select 
              value={formData.ring} 
              onValueChange={(value: 'earth' | 'water' | 'fire' | 'wind' | 'void') => 
                setFormData(prev => ({ ...prev, ring: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rings.map((ring) => (
                  <SelectItem key={ring.value} value={ring.value}>
                    <div>
                      <div className="font-medium">{ring.label}</div>
                      <div className="text-xs text-muted-foreground">{ring.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeSlot">Time Block (Optional)</Label>
              <Select 
                value={formData.timeSlot} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional details or context..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="water">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}