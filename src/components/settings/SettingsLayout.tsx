import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Palette, User, Shield, Bell, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children: ReactNode;
  className?: string;
}

const settingsTabs = [
  {
    id: 'general',
    label: 'General',
    icon: Settings,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
  },
  {
    id: 'account',
    label: 'Account',
    icon: User,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: Shield,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
  },
  {
    id: 'data',
    label: 'Data',
    icon: Database,
  },
];

export function SettingsLayout({
  activeTab = 'general',
  onTabChange,
  children,
  className,
}: SettingsLayoutProps) {
  return (
    <div className={cn('container mx-auto px-4 py-6', className)}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and account settings
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={onTabChange}
        className="space-y-6"
        defaultValue="general"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 h-auto p-1 bg-muted/20">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 text-xs sm:text-sm font-medium transition-colors hover:bg-muted/50 rounded-md"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            {children}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
