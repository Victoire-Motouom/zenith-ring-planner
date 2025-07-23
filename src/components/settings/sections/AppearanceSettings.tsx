import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark' | 'system';

const themeOptions = [
  {
    id: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Bright theme with light colors',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Dark theme for comfortable viewing',
  },
  {
    id: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Match your system appearance',
  },
];

export function AppearanceSettings() {
  const { theme: currentTheme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Appearance</CardTitle>
        </div>
      </CardHeader>

      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Theme</h3>
          <p className="text-sm text-muted-foreground">
            Customize how Zenith looks on your device
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {themeOptions.map((theme) => {
            const Icon = theme.icon;
            const isActive = currentTheme === theme.id;
            
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setTheme(theme.id)}
                className={cn(
                  'flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all hover:bg-accent',
                  isActive && 'border-primary ring-1 ring-primary'
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{theme.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {theme.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Density</p>
            <p className="text-sm text-muted-foreground">
              Adjust the spacing and sizing of UI elements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Default
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
