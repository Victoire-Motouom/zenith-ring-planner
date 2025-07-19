import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, CheckCircle, Circle } from "lucide-react";
import { useState, useEffect } from "react";
import { getTasksByDate, db } from "@/lib/database";
import type { Task } from "@/lib/database";
import AddTaskModal from "./AddTaskModal";

export default function DailyPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadTasks = async () => {
    const dayTasks = await getTasksByDate(selectedDate);
    setTasks(dayTasks);
  };

  useEffect(() => {
    loadTasks();
  }, [selectedDate]);

  const toggleTaskComplete = async (taskId: number, completed: boolean) => {
    try {
      await db.tasks.update(taskId, { completed });
      loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getRingColor = (ring: string) => {
    switch(ring) {
      case 'earth': return 'bg-earth-ring text-white';
      case 'water': return 'bg-water-ring text-white';
      case 'fire': return 'bg-fire-ring text-white';
      case 'wind': return 'bg-wind-ring text-white';
      case 'void': return 'bg-void-ring text-white';
      default: return 'bg-muted';
    }
  };

  const getRingPhilosophy = (ring: string) => {
    switch(ring) {
      case 'earth': return 'Foundation & Discipline';
      case 'water': return 'Adaptability & Flow';
      case 'fire': return 'Decisive Action';
      case 'wind': return 'Observation & Learning';
      case 'void': return 'Intuition & Insight';
      default: return '';
    }
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-water bg-clip-text text-transparent">
            Daily Strategy
          </h1>
          <p className="text-muted-foreground mt-1">Water Ring - Flowing with purpose and intention</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" aria-label={`Change selected date, currently ${selectedDate.toLocaleDateString()}`}>
            <Calendar className="h-4 w-4" />
            {selectedDate.toLocaleDateString()}
          </Button>
          <Button variant="water" className="gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-subtle shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Progress</span>
            <Badge variant="secondary" className="text-sm">
              {completedTasks}/{totalTasks} Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-water transition-all duration-300"
                  style={{ width: `${totalTasks ? (completedTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Progress through mindful action
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks by Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {['earth', 'water', 'fire', 'wind', 'void'].map(ring => {
          const ringTasks = tasks.filter(t => t.ring === ring);
          if (ringTasks.length === 0) return null;

          return (
            <Card key={ring} className="shadow-soft hover:shadow-zenith transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Badge className={`${getRingColor(ring)} capitalize`}>
                    {ring} Ring
                  </Badge>
                  <span className="text-sm font-normal text-muted-foreground">
                    {getRingPhilosophy(ring)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ringTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <button 
                        className="mt-1"
                        onClick={() => toggleTaskComplete(task.id!, !task.completed)}
                        aria-label={task.completed ? `Mark '${task.title}' as incomplete` : `Mark '${task.title}' as complete`}
                      >
                        {task.completed ? (
                          <CheckCircle className="h-5 w-5 text-water-ring" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {task.timeSlot && (
                            <Badge variant="outline" className="text-xs">
                              {task.timeSlot}
                            </Badge>
                          )}
                          {task.category && (
                            <Badge variant="secondary" className="text-xs bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20">
                              {task.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Begin Your Daily Strategy</h3>
            <p className="text-muted-foreground mb-6">
              Plan your day using the wisdom of the Five Rings. Each task belongs to a ring of understanding.
            </p>
            <Button variant="water" className="gap-2" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              Create Your First Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTaskAdded={loadTasks}
        selectedDate={selectedDate}
      />
    </div>
  );
}