import React, { useMemo, useState } from 'react';
import { format, subDays, subMonths, eachMonthOfInterval } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { formatCurrency } from '@/lib/utils';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Recharts Components
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
  TooltipProps
} from 'recharts';

// Chart colors
const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316'  // orange-500
];

// Icons
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart as PieChartIcon, 
  Activity, 
  Target,
  type LucideIcon,
  BarChart3 as BarChart3Icon
} from 'lucide-react';

// Constants
const CATEGORY_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

// Types
type TimeRange = 'week' | 'month' | 'year';

interface FinancialData {
  name: string;
  income: number;
  expenses: number;
}

interface CategorySpending {
  name: string;
  value: number;
  color: string;
}

interface ProductivityMetric {
  date: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
}

interface TimeTrackingMetric {
  date: string;
  hours: number;
}

// Database types
type DbTransaction = {
  id?: number;
  date: Date;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string;
};

type DbTask = {
  id?: number;
  date: Date;
  title: string;
  completed: boolean;
};

type DbTimeSlot = {
  id?: number;
  title: string;
  startTime: string;
  endTime: string;
  date: string;      // YYYY-MM-DD
  description?: string;
  category?: string;
  taskId?: number;
  completed?: boolean;
  order?: number;    // For drag-and-drop ordering
  createdAt: Date;
};

type TimeRange = 'week' | 'month' | 'year';

const ReportingSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'productivity'>('overview');
  const handleTabChange = (value: 'overview' | 'finance' | 'productivity') => {
    setActiveTab(value);
  };
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const now = new Date();
  
  // Memoize tabs configuration to prevent unnecessary re-renders
  const tabs = useMemo(() => [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'finance' as const, label: 'Finance', icon: PieChartIcon },
    { id: 'productivity' as const, label: 'Productivity', icon: Activity },
  ], []);
  
  // Fetch data from IndexedDB
  const dbTransactions = useLiveQuery<DbTransaction[]>(() => db.transactions.toArray()) || [];
  const dbTasks = useLiveQuery<DbTask[]>(() => db.tasks.toArray()) || [];
  const dbTimeSlots = useLiveQuery<DbTimeSlot[]>(() => db.timeSlots.toArray()) || [];
  
  // Time range filter function
  const filterByTimeRange = (date: Date): boolean => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    return date >= subDays(now, days);
  };
  
  // Process transactions data - consolidated financial data calculation
  const financialData = useMemo<FinancialData[]>(() => {
    const filtered = dbTransactions.filter(t => filterByTimeRange(new Date(t.date)));
    
    // Group by day/week/month based on time range
    const groupedData = filtered.reduce<Record<string, FinancialData>>((acc, t) => {
      const date = new Date(t.date);
      let key: string;
      
      if (timeRange === 'week') {
        key = format(date, 'EEE');
      } else if (timeRange === 'month') {
        key = format(date, 'MMM d');
      } else {
        key = format(date, 'MMM yyyy');
      }
      
      if (!acc[key]) {
        acc[key] = { name: key, income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        acc[key].income += t.amount;
      } else if (t.type === 'expense') {
        acc[key].expenses += t.amount;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(groupedData).sort((a, b) => {
      if (timeRange === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.indexOf(a.name) - days.indexOf(b.name);
      }
      return new Date(a.name).getTime() - new Date(b.name).getTime();
    });
  }, [dbTransactions, timeRange, now]);
  
  // Calculate summary metrics
  const totalIncome = useMemo<number>(
    () => financialData.reduce((sum, day) => sum + day.income, 0),
    [financialData]
  );
  
  const totalExpenses = useMemo<number>(
    () => financialData.reduce((sum, day) => sum + day.expenses, 0),
    [financialData]
  );
  
  const netWorth = totalIncome - totalExpenses;
  
  // Calculate monthly summary for charts
  const monthlySummary = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now
    });
    
    // Initialize monthly data with all months in the range
    const monthlyData = months.map(month => ({
      name: format(month, 'MMM yyyy'),
      income: 0,
      expenses: 0
    }));
    
    // Process all transactions to aggregate by month
    dbTransactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthKey = format(transactionDate, 'MMM yyyy');
      const monthData = monthlyData.find(m => m.name === monthKey);
      
      if (monthData) {
        if (transaction.type === 'income') {
          monthData.income += transaction.amount;
        } else if (transaction.type === 'expense') {
          monthData.expenses += Math.abs(transaction.amount);
        }
      }
    });
    
    return monthlyData;
  }, [dbTransactions, now]);
  
  // Calculate productivity rate
  const productivityRate = useMemo(() => {
    const relevantTasks = dbTasks.filter(t => 
      filterByTimeRange(new Date(t.date))
    );
    const completed = relevantTasks.filter(t => t.completed).length;
    return relevantTasks.length > 0 
      ? Math.round((completed / relevantTasks.length) * 100) 
      : 0;
  }, [dbTasks, timeRange, now]);
  
  // Calculate category trends
  const { data: categoryTrends, categories: categoryList } = useMemo(() => {
    const months = eachMonthOfInterval({
      start: timeRange === 'year' ? subMonths(now, 11) : subMonths(now, 5),
      end: now
    });
    
    const trendData: { [month: string]: { [category: string]: number } } = {};
    const categories = new Set<string>();

    months.forEach(date => {
      const monthKey = format(date, 'MMM yyyy');
      trendData[monthKey] = {};
    });

    dbTransactions
      .filter(t => t.type === 'expense' && filterByTimeRange(new Date(t.date)))
      .forEach(t => {
        const monthKey = format(new Date(t.date), 'MMM yyyy');
        if (trendData[monthKey]) {
          trendData[monthKey][t.category] = (trendData[monthKey][t.category] || 0) + t.amount;
          categories.add(t.category);
        }
      });

    // Get top 5 categories by total spending
    const topCategories = Array.from(categories)
      .map(category => ({
        category,
        total: dbTransactions
          .filter(t => t.type === 'expense' && t.category === category && filterByTimeRange(new Date(t.date)))
          .reduce((sum, t) => sum + t.amount, 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(item => item.category);

    return {
      data: Object.entries(trendData).map(([month, data]) => ({
        month,
        ...topCategories.reduce((acc, cat) => ({ ...acc, [cat]: data[cat] || 0 }), {})
      })),
      categories: topCategories
    };
  }, [dbTransactions, timeRange, now]);
  
  // Calculate category spending
  const categorySpending = useMemo<CategorySpending[]>(() => {
    const categoryMap = new Map<string, number>();
    
    dbTransactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const current = categoryMap.get(transaction.category) || 0;
        categoryMap.set(transaction.category, current + transaction.amount);
      }
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [dbTransactions]);
  
  // Calculate time tracking metrics
  const timeTrackingMetrics = useMemo<TimeTrackingMetric[]>(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const metrics: TimeTrackingMetric[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLabel = timeRange === 'week' 
        ? format(date, 'EEE') 
        : format(date, 'MMM d');
        
      const daySlots = dbTimeSlots.filter(slot => {
        const slotDate = new Date(slot.date);
        return format(slotDate, 'yyyy-MM-dd') === dateStr;
      });
      
      const totalHours = daySlots.reduce((sum, slot) => {
        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);
        return sum + ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
      }, 0);
      
      metrics.push({
        date: dayLabel,
        hours: parseFloat(totalHours.toFixed(1))
      });
    }
    
    return metrics;
  }, [dbTimeSlots, timeRange, now]);
  
  // Calculate time tracking data
  const timeTrackingData = useMemo<TimeTrackingMetric[]>(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const data: TimeTrackingMetric[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLabel = timeRange === 'week' 
        ? format(date, 'EEE') 
        : format(date, 'MMM d');

      // Filter time slots for this date
      const daySlots = dbTimeSlots.filter(slot => {
        const slotDate = typeof slot.date === 'string' ? slot.date : format(slot.date as unknown as Date, 'yyyy-MM-dd');
        return slotDate === dateStr;
      });

      // Calculate total hours for the day
      const totalHours = daySlots.reduce((sum, slot) => {
        if (slot.startTime && slot.endTime) {
          const start = new Date(`${dateStr}T${slot.startTime}`);
          const end = new Date(`${dateStr}T${slot.endTime}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return sum + (isNaN(hours) ? 0 : hours);
        }
        return sum;
      }, 0);

      data.push({
        date: dayLabel,
        hours: parseFloat(totalHours.toFixed(1))
      });
    }
    
    return data;
  }, [timeRange, dbTimeSlots, now]);

  // Calculate productivity metrics
  const productivityMetrics = useMemo<ProductivityMetric[]>(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const metrics: ProductivityMetric[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLabel = timeRange === 'week' 
        ? format(date, 'EEE') 
        : format(date, 'MMM d');

      const relevantTasks = dbTasks.filter(t => 
        format(new Date(t.date), 'yyyy-MM-dd') === dateStr
      );
      
      const completedTasks = relevantTasks.filter(t => t.completed).length;
      const totalTasks = relevantTasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      metrics.push({ 
        date: dayLabel, 
        completionRate,
        totalTasks,
        completedTasks
      });
    }
    
    return metrics;
  }, [timeRange, dbTasks, now]);

  // Calculate summary metrics
  const totalHoursTracked = useMemo(() => 
    timeTrackingMetrics.reduce((sum: number, day: TimeTrackingMetric) => sum + day.hours, 0),
    [timeTrackingMetrics]
  );
  
  const avgDailyHours = useMemo(() => 
    timeTrackingMetrics.length > 0
      ? totalHoursTracked / timeTrackingMetrics.length
      : 0,
    [timeTrackingMetrics, totalHoursTracked]
  );
    
  const mostProductiveDay = useMemo(() => 
    timeTrackingMetrics.length > 0
      ? timeTrackingMetrics.reduce((max, day) => day.hours > max.hours ? day : timeTrackingMetrics[0])
      : null,
    [timeTrackingMetrics]
  );
  
  const avgDailyProductivity = useMemo(() => 
    productivityMetrics.length > 0
      ? productivityMetrics.reduce((sum: number, day: ProductivityMetric) => sum + day.completionRate, 0) / productivityMetrics.length
      : 0,
    [productivityMetrics]
  );
  
  // Custom tooltip component
  interface CustomTooltipProps extends TooltipProps<number, string> {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      payload: any;
      color: string;
      dataKey: string | number;
    }>;
    label?: string;
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name?.toLowerCase() === 'completion rate' 
              ? `${entry.value.toFixed(1)}%`
              : entry.name?.toLowerCase() === 'hours' 
                ? `${entry.value} hrs`
                : formatCurrency(entry.value as number)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold bg-gradient-zenith bg-clip-text text-transparent">
            Analytics & Insights
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Gain deep insights into your financial patterns and productivity trends.
          </p>
        </div>
        
        <div className="w-full md:w-48">
          <Select 
            value={timeRange} 
            onValueChange={(value: string) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center justify-center gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time spending</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Worth</CardTitle>
            <Activity className="h-4 w-4 text-water-ring" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netWorth)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Financial position</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Productivity</CardTitle>
            <Target className="h-4 w-4 text-fire-ring" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fire-ring">{productivityRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Task completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5 text-fire-ring" />
              <CardTitle className="text-lg">Monthly Income vs. Expenses</CardTitle>
            </div>
            <CardDescription>Current month financial flow</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10b981" />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-water-ring" />
              <CardTitle className="text-lg">Spending by Category</CardTitle>
            </div>
            <CardDescription>Expense distribution breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categorySpending}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categorySpending.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Full Width Charts */}
      <div className="space-y-6">
        <Card className="shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-earth-ring" />
              <CardTitle className="text-lg">Category Spending Trends</CardTitle>
            </div>
            <CardDescription>6-month spending patterns by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
            <LineChart data={categoryTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {categoryList.map((category, index) => (
                <Line key={category} type="monotone" dataKey={category} stroke={COLORS[index % COLORS.length]} />
              ))}
            </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-void-ring" />
              <CardTitle className="text-lg">Productivity Metrics</CardTitle>
            </div>
            <CardDescription>7-day task completion trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productivityMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit="%" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completionRate" name="Task Completion Rate" stroke="#8884d8" />
            </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-6">
          {/* Income vs Expenses Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>Track your financial flow over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10b981" />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Spending */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Breakdown of your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categorySpending.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-6">
          {/* Task Completion Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Rate</CardTitle>
              <CardDescription>Your productivity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productivityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="completionRate" 
                      name="Completion Rate %" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
              <CardDescription>Time spent on tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeTrackingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" name="Hours Tracked" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingSection;
