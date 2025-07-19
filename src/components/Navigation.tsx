import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, Calendar, Target, BookOpen, Settings, Sparkles, Repeat, BarChart } from "lucide-react";

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  const navigationItems = [
    { id: 'budget', label: 'Budget', icon: Wallet, ring: 'earth' },
    { id: 'habits', label: 'Habits', icon: Repeat, ring: 'earth' },
    { id: 'planner', label: 'Planner', icon: Calendar, ring: 'water' },
    { id: 'goals', label: 'Goals', icon: Target, ring: 'fire' },
    { id: 'reflection', label: 'Reflect', icon: BookOpen, ring: 'wind' },
    { id: 'reports', label: 'Reports', icon: BarChart, ring: 'wind' },
    { id: 'insights', label: 'Insights', icon: Sparkles, ring: 'void' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getRingVariant = (ring: string) => {
    switch(ring) {
      case 'earth': return 'earth';
      case 'water': return 'water';
      case 'fire': return 'default';
      case 'wind': return 'secondary';
      case 'void': return 'ghost';
      default: return 'default';
    }
  };

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-card/95 backdrop-blur-md border shadow-zenith">
      <div className="flex gap-2 p-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? getRingVariant(item.ring || '') : "ghost"}
              size="sm"
              onClick={() => onSectionChange(item.id)}
              aria-label={`Navigate to ${item.label} section`}
              className={`flex flex-col gap-1 h-auto py-2 px-3 transition-all duration-300 ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}