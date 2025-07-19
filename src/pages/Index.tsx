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
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile on component mount and on window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Process recurring transactions and check for goal reminders on load
    processRecurringTransactions();
    checkGoalReminders();

    // Set up an interval to check every minute
    const intervalId = setInterval(checkGoalReminders, 60000);

    // Clean up the interval and event listener when the component unmounts
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

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
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-center">
            <div className="text-2xl font-bold mb-2">Loading...</div>
            <div className="text-sm text-muted-foreground">Preparing your experience</div>
          </div>
        </div>
      }>
        <main className={`container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 transition-all duration-300 ${isMobile ? 'max-w-full' : ''}`}>
          {renderSection()}
        </main>
      </Suspense>
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} isMobile={isMobile} />
    </div>
  );
};

export default Index;
