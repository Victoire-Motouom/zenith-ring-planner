import { useState, useEffect } from 'react';
import { SettingsState, Theme } from '@/types/settings';
import { getSetting, setSetting } from '@/lib/settings';

export function useSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'system',
    userProfile: {
      name: '',
      email: ''
    },
    notifications: {
      enabled: false,
      reminders: true,
      weeklyReports: true,
      monthlyReports: true
    },
    privacy: {
      analytics: true,
      crashReports: true,
      dataCollection: false
    }
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          theme,
          notificationsEnabled,
          userName,
          userEmail
        ] = await Promise.all([
          getSetting<Theme>('theme', 'system'),
          getSetting<boolean>('notifications_enabled', false),
          getSetting<string>('user_name', ''),
          getSetting<string>('user_email', '')
        ]);

        setSettings(prev => ({
          ...prev,
          theme,
          notifications: {
            ...prev.notifications,
            enabled: notificationsEnabled
          },
          userProfile: {
            name: userName,
            email: userEmail
          }
        }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = async <T extends keyof SettingsState>(
    key: T,
    value: SettingsState[T]
  ) => {
    try {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));

      // Persist to storage
      if (typeof value === 'string') {
        await setSetting(key, value);
      } else if (key === 'notifications') {
        await setSetting('notifications_enabled', (value as any).enabled);
      } else if (key === 'userProfile') {
        const profile = value as { name: string; email: string };
        await Promise.all([
          setSetting('user_name', profile.name),
          setSetting('user_email', profile.email)
        ]);
      }
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
      throw error;
    }
  };

  return {
    settings,
    isLoading,
    updateSetting,
    setTheme: (theme: Theme) => updateSetting('theme', theme)
  };
}
