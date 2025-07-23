export type Theme = 'light' | 'dark' | 'system';

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  reminders: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

export interface PrivacySettings {
  analytics: boolean;
  crashReports: boolean;
  dataCollection: boolean;
}

export interface BackupData {
  transactions: any[];
  budgets: any[];
  tasks: any[];
  reflections: any[];
  goals: any[];
  exportDate: string;
  version: string;
}

export interface SettingsState {
  theme: Theme;
  userProfile: UserProfile;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  lastBackup?: string;
}
