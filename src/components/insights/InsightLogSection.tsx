import React, { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Insight } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

const InsightLogSection: React.FC = () => {
  const [newInsight, setNewInsight] = useState('');

  const insights = useLiveQuery(
    () => db.insights.orderBy('createdAt').reverse().toArray(),
    []
  );

  const handleAddInsight = useCallback(async () => {
    if (newInsight.trim() === '') {
      toast({
        title: 'Insight cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      await db.insights.add({
        content: newInsight,
        createdAt: new Date(),
      });
      setNewInsight(''); // Clear the textarea after adding
      toast({
        title: 'Insight Captured',
        description: 'Your thought has been saved to the Void Ring.',
      });
    } catch (error) {
      console.error('Failed to add insight:', error);
      toast({
        title: 'Error',
        description: 'Could not save your insight. Please try again.',
        variant: 'destructive',
      });
    }
  }, [newInsight]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Insight Log</CardTitle>
        <CardDescription>The Void Ring: Capture spontaneous thoughts and fleeting ideas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="What is on your mind?"
            value={newInsight}
            onChange={(e) => setNewInsight(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleAddInsight} className="self-end">
            Capture Insight
          </Button>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Logbook</h3>
          <ScrollArea className="h-[400px] w-full pr-4">
            <div className="space-y-4">
              {insights && insights.length > 0 ? (
                insights.map((insight: Insight) => (
                  <div key={insight.id} className="p-4 bg-muted rounded-lg shadow-sm">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{insight.content}</p>
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      {format(insight.createdAt, 'PPP p')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>Your logbook is empty.</p>
                  <p className="text-xs">The void awaits your thoughts.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightLogSection;
