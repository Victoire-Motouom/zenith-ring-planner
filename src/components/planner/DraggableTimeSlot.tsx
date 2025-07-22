import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { TimeSlot, Task } from '@/lib/database';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableTimeSlotProps {
  timeSlot: TimeSlot & { task?: Task };
  index: number;
  onEdit: (slot: TimeSlot & { task?: Task }) => void;
  onDelete: (id: string) => void;
}

const DraggableTimeSlot: React.FC<DraggableTimeSlotProps> = ({
  timeSlot,
  index,
  onEdit,
  onDelete,
}) => {
  return (
    <Draggable draggableId={timeSlot.id?.toString() || ''} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2"
        >
          <Card className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {timeSlot.startTime} - {timeSlot.endTime}
                  </span>
                  {timeSlot.task && (
                    <span className="text-sm text-muted-foreground">
                      {timeSlot.task.title}
                    </span>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(timeSlot)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(timeSlot.id?.toString() || '')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default DraggableTimeSlot;