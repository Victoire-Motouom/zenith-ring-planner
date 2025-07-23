'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsLayout } from '@/components/settings/SettingsLayout';

// Dynamically import settings sections with loading states
const GeneralSettings = dynamic(
  () => import('@/components/settings/sections/GeneralSettings').then(mod => mod.GeneralSettings),
  { 
    loading: () => <SettingsSkeleton />,
    ssr: false 
  }
);

const AppearanceSettings = dynamic(
  () => import('@/components/settings/sections/AppearanceSettings').then(mod => mod.AppearanceSettings),
  { 
    loading: () => <SettingsSkeleton />,
    ssr: false 
  }
);

const DataSettings = dynamic(
  () => import('@/components/settings/sections/DataSettings').then(mod => mod.DataSettings),
  { 
    loading: () => <SettingsSkeleton />,
    ssr: false 
  }
);

// Skeleton loader for settings sections
function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  // Render the appropriate settings section based on the active tab
  const renderSettingsContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'data':
        return <DataSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <SettingsLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      {renderSettingsContent()}
    </SettingsLayout>
  );
}
