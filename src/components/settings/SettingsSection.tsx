import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  Shield, 
  Settings2, 
  Bell, 
  Moon, 
  Sun,
  Palette,
  User,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/database";
import { getSetting, setSetting } from "@/lib/settings";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeProvider";

export default function SettingsSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { theme, toggleTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const notifSetting = await getSetting('notifications_enabled', false);
      setNotifications(notifSetting);
    };

    loadSettings();
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleNotificationChange = async (enabled: boolean) => {
    setNotifications(enabled);
    await setSetting('notifications_enabled', enabled);

    if (enabled) {
      if (Notification.permission === 'granted') {
        toast({ title: "Notifications Enabled", description: "You will now receive reminders." });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast({ title: "Notifications Enabled", description: "You will now receive reminders." });
        } else {
          toast({ title: "Permission Denied", description: "Notifications cannot be sent without permission.", variant: 'destructive' });
          setNotifications(false);
          await setSetting('notifications_enabled', false);
        }
      }
    } else {
      toast({ title: "Notifications Disabled", description: "You will no longer receive reminders." });
    }
  };

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
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenith-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Data Exported", description: "Your Zenith Planner data has been successfully exported." });
    } catch (error) {
      toast({ title: "Export Failed", description: "Failed to export data. Please try again.", variant: "destructive" });
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
        throw new Error('Invalid backup file format');
      }

      await db.transaction('rw', [db.transactions, db.budgets, db.tasks, db.reflections, db.goals], async () => {
        await db.transactions.clear();
        await db.budgets.clear();
        await db.tasks.clear();
        await db.reflections.clear();
        await db.goals.clear();

        await db.transactions.bulkAdd(data.transactions.map((t: any) => ({ ...t, date: new Date(t.date), createdAt: new Date(t.createdAt) })));
        await db.budgets.bulkAdd(data.budgets.map((b: any) => ({ ...b, createdAt: new Date(b.createdAt) })));
        await db.tasks.bulkAdd(data.tasks.map((t: any) => ({ ...t, date: new Date(t.date), createdAt: new Date(t.createdAt) })));
        await db.reflections.bulkAdd(data.reflections.map((r: any) => ({ ...r, date: new Date(r.date), createdAt: new Date(r.createdAt) })));
        await db.goals.bulkAdd(data.goals.map((g: any) => ({ ...g, targetDate: new Date(g.targetDate), createdAt: new Date(g.createdAt) })));
      });

      toast({ title: "Data Imported", description: "Your backup has been successfully restored." });
      event.target.value = '';
    } catch (error) {
      toast({ title: "Import Failed", description: "Failed to import data. Please check the file format.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }

    try {
      await db.transaction('rw', [db.transactions, db.budgets, db.tasks, db.reflections, db.goals], async () => {
        await db.transactions.clear();
        await db.budgets.clear();
        await db.tasks.clear();
        await db.reflections.clear();
        await db.goals.clear();
      });

      toast({ title: "Data Cleared", description: "All your data has been permanently deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to clear data. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 sm:pb-6 max-w-4xl mx-auto">
      <div className="pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-void-ring/10">
            <Settings2 className="h-6 w-6 text-void-ring" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-zenith bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5">Void Ring - Managing the essence of your practice</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto sm:h-10">
          <TabsTrigger value="general" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-0 text-xs sm:text-sm">
            <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-0 text-xs sm:text-sm">
            <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-0 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Account</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="flex flex-col space-y-1 pr-4">
                  <span>Enable Notifications</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Receive reminders for upcoming tasks and deadlines.
                  </span>
                </Label>
                <Switch 
                  id="notifications" 
                  checked={notifications}
                  onCheckedChange={handleNotificationChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm sm:text-base">Backup & Restore</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your data is stored locally on your device. Regular backups ensure your progress is preserved.
                  <span className="block mt-1 text-xs text-amber-500 flex items-start">
                    <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                    <span>Always export your data before clearing app data or uninstalling.</span>
                  </span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={exportData}
                    disabled={isExporting}
                    variant="default"
                    className="gap-2 flex-1 sm:flex-initial justify-center"
                  >
                    <Download className="h-4 w-4 flex-shrink-0" />
                    <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2 relative flex-1 sm:flex-initial justify-center"
                    disabled={isImporting}
                  >
                    <Upload className="h-4 w-4 flex-shrink-0" />
                    <span>{isImporting ? 'Importing...' : 'Import Data'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isImporting}
                    />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm sm:text-base text-destructive flex items-start sm:items-center gap-2">
                    <Trash2 className="h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0" />
                    <span>Danger Zone</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground pl-6 sm:pl-6">
                    Permanent actions that cannot be undone. Proceed with caution.
                  </p>
                </div>
                <div className="pl-6 sm:pl-6">
                  <Button 
                    onClick={clearAllData}
                    variant="destructive"
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5" />
                Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="dark-mode" className="text-sm sm:text-base">Dark Mode</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch 
                    id="dark-mode"
                    className="data-[state=checked]:bg-void-ring"
                    checked={theme === 'dark'}
                    onCheckedChange={() => {
                      toggleTheme();
                      document.documentElement.classList.toggle('dark', theme === 'light');
                      document.documentElement.setAttribute('data-theme', theme === 'light' ? 'dark' : 'light');
                    }}
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="your.email@example.com" />
                </div>
                <Button className="mt-2">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Local-First Privacy</h4>
                <p className="text-sm text-muted-foreground">
                  All your data is stored exclusively on your device. We do not have access to your information, ensuring complete privacy.
                </p>
              </div>
              <Button variant="outline" disabled>Manage Data Encryption (Coming Soon)</Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5" />
                About Zenith Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Version</h4>
                <p className="text-sm text-muted-foreground">
                  Zenith Planner v1.0.0
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Installation</h4>
                <p className="text-sm text-muted-foreground">
                  Add Zenith Planner to your home screen for a native app experience. Look for the "Install" or "Add to Home Screen" option in your browser.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Offline Capability</h4>
                <p className="text-sm text-muted-foreground">
                  This app works offline. Once loaded, you can use all features without an internet connection.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium">Philosophy</h4>
                <p className="text-sm text-muted-foreground italic">
                  "Know your enemy and know yourself; in a hundred battles, you will never be defeated." - Musashi
                </p>
                <p className="text-sm text-muted-foreground">
                  Zenith Planner applies the timeless wisdom of Miyamoto Musashi's Five Rings to modern life, helping you master both financial discipline and daily strategy.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}