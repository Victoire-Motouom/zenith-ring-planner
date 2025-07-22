import { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurrenceSettingsProps {
  value?: {
    frequency: RecurrenceFrequency;
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
  };
  onChange: (value: {
    frequency: RecurrenceFrequency;
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
  }) => void;
}

export function RecurrenceSettings({ value, onChange }: RecurrenceSettingsProps) {
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(value?.frequency || 'weekly');
  const [interval, setInterval] = useState<number>(value?.interval || 1);
  const [endDate, setEndDate] = useState<Date | undefined>(value?.endDate);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(value?.daysOfWeek || []);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Update parent when local state changes
  useEffect(() => {
    onChange({
      frequency,
      interval: Math.max(1, interval || 1),
      endDate,
      daysOfWeek: frequency === 'weekly' || frequency === 'custom' ? daysOfWeek : undefined
    });
  }, [frequency, interval, endDate, daysOfWeek, onChange]);

  const handleDayToggle = (dayIndex: number) => {
    setDaysOfWeek(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  const dayNames = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Recurrence</Label>
          <Select
            value={frequency}
            onValueChange={(value: RecurrenceFrequency) => {
              setFrequency(value);
              // Reset days of week when frequency changes (except for weekly/custom)
              if (value !== 'weekly' && value !== 'custom') {
                setDaysOfWeek([]);
              }
            }}
          >
            <SelectTrigger id="frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekdays">Weekdays</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interval">Every</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="interval"
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="whitespace-nowrap">
              {interval === 1 
                ? frequency === 'daily' ? 'day' 
                  : frequency === 'weekly' ? 'week' 
                  : frequency === 'monthly' ? 'month' 
                  : 'year'
                : frequency === 'daily' ? 'days' 
                  : frequency === 'weekly' ? 'weeks' 
                  : frequency === 'monthly' ? 'months' 
                  : 'years'}
            </span>
          </div>
        </div>
      </div>

      {(frequency === 'weekly' || frequency === 'custom') && (
        <div className="space-y-2">
          <Label>On days</Label>
          <div className="flex space-x-1">
            {dayNames.map((day, index) => (
              <Button
                key={index}
                type="button"
                variant={daysOfWeek.includes(index) ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
                onClick={() => handleDayToggle(index)}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Ends</Label>
        <div className="flex items-center space-x-4">
          <Button
            variant={!endDate ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setEndDate(undefined);
              setShowEndDatePicker(false);
            }}
          >
            Never
          </Button>
          <Popover open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant={endDate ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date);
                  setShowEndDatePicker(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

export default RecurrenceSettings;