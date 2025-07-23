import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/lib/database';
import { format } from 'date-fns';

export function DataSettings() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const exportData = async () => {
    setIsExporting(true);
    try {
      const data = {
        transactions: await db.transactions.toArray(),
        budgets: await db.budgets.toArray(),
        tasks: await db.tasks.toArray(),
        reflections: await db.reflections.toArray(),
        goals: await db.goals.toArray(),
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenith-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup created',
        description: 'Your data has been successfully exported.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.transactions || !data.budgets || !data.tasks || !data.reflections || !data.goals) {
        throw new Error('Invalid backup file');
      }

      // Ask for confirmation before importing
      if (!confirm('This will replace your current data. Are you sure?')) {
        return;
      }

      await db.transaction('rw', [
        db.transactions,
        db.budgets,
        db.tasks,
        db.reflections,
        db.goals,
      ], async () => {
        // Clear existing data
        await Promise.all([
          db.transactions.clear(),
          db.budgets.clear(),
          db.tasks.clear(),
          db.reflections.clear(),
          db.goals.clear(),
        ]);

        // Import new data
        await Promise.all([
          db.transactions.bulkAdd(data.transactions),
          db.budgets.bulkAdd(data.budgets),
          db.tasks.bulkAdd(data.tasks),
          db.reflections.bulkAdd(data.reflections),
          db.goals.bulkAdd(data.goals),
        ]);
      });

      toast({
        title: 'Import successful',
        description: 'Your data has been successfully imported.',
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import failed',
        description: 'There was an error importing your data.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset the input value to allow re-uploading the same file
      event.target.value = '';
    }
  };

  const clearAllData = async () => {
    if (!confirm('This will permanently delete all your data. Are you sure?')) {
      return;
    }

    setIsClearing(true);
    try {
      await db.transaction('rw', [
        db.transactions,
        db.budgets,
        db.tasks,
        db.reflections,
        db.goals,
      ], async () => {
        await Promise.all([
          db.transactions.clear(),
          db.budgets.clear(),
          db.tasks.clear(),
          db.reflections.clear(),
          db.goals.clear(),
        ]);
      });

      toast({
        title: 'Data cleared',
        description: 'All your data has been permanently deleted.',
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast({
        title: 'Failed to clear data',
        description: 'There was an error clearing your data.',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Data Management</CardTitle>
        </div>
      </CardHeader>

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Backup & Restore</h3>
            <p className="text-sm text-muted-foreground">
              Export your data for backup or transfer to another device
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={exportData}
              disabled={isExporting}
              className="flex-1 justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>

            <Button
              variant="outline"
              asChild
              className="flex-1 justify-center gap-2"
              disabled={isImporting}
            >
              <label>
                <Upload className="h-4 w-4" />
                {isImporting ? 'Importing...' : 'Import Data'}
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div>
            <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete all your data. This action cannot be undone.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={clearAllData}
            disabled={isClearing}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isClearing ? 'Clearing...' : 'Clear All Data'}
          </Button>
        </div>
      </div>
    </div>
  );
}
