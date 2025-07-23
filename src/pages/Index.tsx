import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { processRecurringTransactions } from '@/lib/database';
import { checkGoalReminders } from '@/lib/notifications';

// Direct imports for debugging
import BudgetOverview from "@/components/budget/BudgetOverview";
import PlannerView from "@/components/planner/PlannerView";
import GoalsSection from "@/components/goals/GoalsSection";
import ReflectionSection from "@/components/reflection/ReflectionSection";
import SettingsSection from "@/components/settings/SettingsSection";
import InsightLogSection from "@/components/insights/InsightLogSection";
import HabitTrackerSection from "@/components/habits/HabitTrackerSection";
import ReportingSection from "@/components/reporting/ReportingSection";

// A mapping from section key to component
const sectionComponents = {
  budget: BudgetOverview,
  planner: PlannerView,
  goals: GoalsSection,
  reflection: ReflectionSection,
  settings: SettingsSection,
  insights: InsightLogSection,
  habits: HabitTrackerSection,
  reports: ReportingSection,
};



const Index = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('budget');
  
  // Update active section based on URL
  useEffect(() => {
    const path = location.pathname.replace(/^\//, '');
    
    // Set active section based on URL or default to 'budget'
    const section = path || 'budget';
    setActiveSection(section);
  }, [location.pathname]);
  
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    navigate(`/${section}`);
  };

  useEffect(() => {
    
    // Process recurring transactions and check for goal reminders on load
    processRecurringTransactions();
    checkGoalReminders();

    // Set up an interval to check every minute
    const intervalId = setInterval(checkGoalReminders, 60000);

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const renderSection = () => {
    if (!activeSection) return null;

    const SectionComponent = sectionComponents[activeSection as keyof typeof sectionComponents];
    if (!SectionComponent) return <div>Section not found</div>;

    return <SectionComponent />;
  };

  // No need to check for focus page anymore as we've removed it

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 overflow-y-auto p-4 pb-24 sm:pb-28">
        {renderSection()}
      </main>
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange} 
      />
    </div>
  );
};

export default Index;
