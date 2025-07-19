import { useState, Suspense, lazy, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { processRecurringTransactions } from '@/lib/database';
import { checkGoalReminders } from '@/lib/notifications';

// A mapping from section key to a dynamic import function.
const sectionImporters = {
  budget: () => import("@/components/budget/BudgetOverview"),
    planner: () => import("@/components/planner/PlannerView"),
  goals: () => import("@/components/goals/GoalsSection"),
  reflection: () => import("@/components/reflection/ReflectionSection"),
  settings: () => import("@/components/settings/SettingsSection"),
  insights: () => import('@/components/insights/InsightLogSection'),
  habits: () => import('@/components/habits/HabitTrackerSection'),
  reports: () => import('@/components/reporting/ReportingSection'),
};

// A mapping from section key to the expected named export. 
// If a component uses a default export, its entry can be omitted.
const componentNameMapping: { [key: string]: string } = {
  budget: 'BudgetOverview',
  // planner: 'DailyPlanner', // PlannerView uses a default export
};

const Index = () => {
  const [activeSection, setActiveSection] = useState('budget');

  useEffect(() => {
    // Process recurring transactions and check for goal reminders on load
    processRecurringTransactions();
    checkGoalReminders();

    // Set up an interval to check every minute
    const intervalId = setInterval(checkGoalReminders, 60000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this runs only once on mount

  const renderSection = () => {
    if (!activeSection) return null;

    const importer = sectionImporters[activeSection as keyof typeof sectionImporters];
    if (!importer) return <div>Section not found</div>;

    // Lazily load the component, handling both default and named exports.
    const SectionComponent = lazy(async () => {
      const module = await importer();
      const componentName = componentNameMapping[activeSection];
      // If a specific component name is mapped, use it (for named exports).
      if (componentName && (module as any)[componentName]) {
        return { default: (module as any)[componentName] };
      }
      // Otherwise, assume it's a default export.
      return module;
    });

    return <SectionComponent />;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pb-32">
        <Suspense fallback={<div className="text-center p-12">Loading...</div>}>
          {renderSection()}
        </Suspense>
      </div>

      {/* Navigation */}
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
    </div>
  );
};

export default Index;
