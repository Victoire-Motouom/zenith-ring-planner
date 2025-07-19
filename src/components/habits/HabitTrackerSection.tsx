import React, { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Habit, HabitEntry } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Flame } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';

const HabitTrackerSection: React.FC = () => {
  const [newHabitName, setNewHabitName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [category, setCategory] = useState<'general' | 'financial'>('general');

  const habits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), []);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const habitEntries: HabitEntry[] = useLiveQuery(
    () => db.habitEntries.where({ date: today }).toArray(),
    [today]
  ) || [];

  const completedHabitIds = new Set(habitEntries.filter(e => e.completed).map(e => e.habitId));

  const handleAddHabit = useCallback(async () => {
    if (newHabitName.trim() === '') {
      toast({ title: 'Habit name cannot be empty', variant: 'destructive' });
      return;
    }

    try {
      await db.habits.add({
        name: newHabitName,
        frequency,
        category,
        createdAt: new Date(),
      });
      setNewHabitName('');
      toast({ title: 'Habit Added', description: `Your new ${frequency} habit has been saved.` });
    } catch (error) {
      console.error('Failed to add habit:', error);
      toast({ title: 'Error', description: 'Could not save your habit.', variant: 'destructive' });
    }
  }, [newHabitName, frequency, category]);

  const handleCheckHabit = useCallback(async (habitId: number, isCompleted: boolean) => {
    try {
      const existingEntry = await db.habitEntries.where({ habitId, date: today }).first();

      if (existingEntry) {
        await db.habitEntries.update(existingEntry.id!, { completed: isCompleted });
      } else {
        await db.habitEntries.add({
          habitId,
          date: today,
          completed: isCompleted,
        });
      }
      toast({ title: isCompleted ? 'Habit Completed!' : 'Habit Unchecked', description: 'Your progress has been saved.' });
    } catch (error) {
      console.error('Failed to update habit entry:', error);
      toast({ title: 'Error', description: 'Could not save your progress.', variant: 'destructive' });
    }
  }, [today]);

  const calculateStreak = useCallback((habitId: number) => {
    const completedDates = new Set(
      habitEntries
        .filter(entry => entry.habitId === habitId && entry.completed)
        .map(entry => entry.date)
    );

    if (completedDates.size === 0) {
      return 0;
    }

    let streak = 0;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // Determine the starting point for the streak calculation
    let currentDate = new Date();
    if (!completedDates.has(todayStr) && !completedDates.has(yesterdayStr)) {
      return 0; // No streak if not completed today or yesterday
    }

    if (!completedDates.has(todayStr)) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Loop backwards from the starting date to count consecutive days
    while (true) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      if (completedDates.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [habitEntries]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Habit Tracker</CardTitle>
        <CardDescription>The Earth Ring: Cultivate discipline by tracking your habits.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">Create New Habit</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="e.g., Review budget, exercise..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="md:col-span-2"
            />
            <Select value={frequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(value: 'general' | 'financial') => setCategory(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddHabit} className="self-end">
            Add Habit
          </Button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">My Habits</h3>
          <ScrollArea className="h-[400px] w-full pr-4">
            <div className="space-y-4">
              {habits && habits.length > 0 ? (
                habits.map((habit: Habit) => (
                  <div key={habit.id} className="p-4 bg-muted rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id={`habit-${habit.id}`}
                        checked={completedHabitIds.has(habit.id!)}
                        onCheckedChange={(checked) => handleCheckHabit(habit.id!, !!checked)}
                      />
                      <label htmlFor={`habit-${habit.id}`} className="font-medium">{habit.name}</label>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="h-4 w-4" />
                        <span className="font-bold text-sm">{calculateStreak(habit.id!)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${habit.category === 'financial' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {habit.category}
                        </span>
                        <p className="text-sm text-muted-foreground capitalize w-16 text-right">{habit.frequency}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>No habits defined yet.</p>
                  <p className="text-xs">Add a new habit to start building discipline.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitTrackerSection;
