import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">General Settings</CardTitle>
        </div>
      </CardHeader>

      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Application</h3>
          <p className="text-sm text-muted-foreground">
            Configure general application preferences
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Language</p>
              <p className="text-sm text-muted-foreground">
                Change the application language
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              English (US)
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Default View</p>
              <p className="text-sm text-muted-foreground">
                Choose your default dashboard view
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
