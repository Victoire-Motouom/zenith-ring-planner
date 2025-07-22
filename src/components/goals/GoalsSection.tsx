import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Target, TrendingUp, Calendar, Trash2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/database";
import type { Goal, StrategicStep } from "@/lib/database";
import { toast } from "@/hooks/use-toast";

export default function GoalsSection() {
  const [goals, setGoals] = useState<(Goal & { linkedAmount: number; totalProgress: number })[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateProgressModal, setShowUpdateProgressModal] = useState(false);
  const [showStrategicPlanModal, setShowStrategicPlanModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [strategicSteps, setStrategicSteps] = useState<StrategicStep[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [amountToAdd, setAmountToAdd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 30 days from now
    category: 'financial' as 'financial' | 'personal',
    reminderDate: ''
  });

  const loadGoals = async () => {
    try {
      const allGoals = await db.goals.toArray();
      const incomeTransactions = await db.transactions.where('type').equals('income').and(tx => !!tx.goalId).toArray();

      const linkedAmounts = incomeTransactions.reduce((acc, tx) => {
        if (tx.goalId) {
          acc[tx.goalId] = (acc[tx.goalId] || 0) + tx.amount;
        }
        return acc;
      }, {} as Record<number, number>);

      const goalsWithProgress = allGoals.map(goal => {
        const linkedAmount = linkedAmounts[goal.id!] || 0;
        const totalProgress = goal.currentAmount + linkedAmount;
        return { ...goal, linkedAmount, totalProgress };
      });

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast({
        title: "Error",
        description: "Failed to load goals. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadStrategicSteps = async (goalId: number) => {
    try {
      const steps = await db.strategicSteps.where('goalId').equals(goalId).toArray();
      setStrategicSteps(steps);
    } catch (error) {
      console.error('Error loading strategic steps:', error);
      toast({ title: "Error", description: "Failed to load strategic steps.", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    if (selectedGoal && showStrategicPlanModal) {
      loadStrategicSteps(selectedGoal.id!);
    }
  }, [selectedGoal, showStrategicPlanModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.targetAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await db.goals.add({
        title: formData.title,
        description: formData.description,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        targetDate: new Date(formData.targetDate),
        category: formData.category,
        reminderDate: formData.reminderDate ? new Date(formData.reminderDate) : undefined,
        reminderSent: false,
        createdAt: new Date()
      });

      toast({
        title: "Goal Created",
        description: "Your goal has been successfully created.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'financial',
        reminderDate: ''
      });

      setShowAddModal(false);
      await loadGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStep = async () => {
    if (!newStepTitle || !selectedGoal) return;
    try {
      await db.strategicSteps.add({
        goalId: selectedGoal.id!,
        title: newStepTitle,
        isCompleted: false,
        createdAt: new Date(),
      });
      setNewStepTitle('');
      await loadStrategicSteps(selectedGoal.id!);
    } catch (error) {
      console.error("Error adding step:", error);
      toast({ title: "Error", description: "Failed to add step.", variant: "destructive" });
    }
  };

  const handleToggleStep = async (step: StrategicStep) => {
    try {
      await db.strategicSteps.update(step.id!, { isCompleted: !step.isCompleted });
      await loadStrategicSteps(step.goalId);
    } catch (error) {
      console.error("Error updating step:", error);
      toast({ title: "Error", description: "Failed to update step.", variant: "destructive" });
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    if (!selectedGoal) return;
    try {
      await db.strategicSteps.delete(stepId);
      await loadStrategicSteps(selectedGoal.id!);
    } catch (error) {
      console.error("Error deleting step:", error);
      toast({ title: "Error", description: "Failed to delete step.", variant: "destructive" });
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedGoal || !amountToAdd) {
      toast({
        title: "Missing Information",
        description: "Please enter an amount to add.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCurrentAmount = selectedGoal.currentAmount + parseFloat(amountToAdd);
      await db.goals.update(selectedGoal.id!, { currentAmount: newCurrentAmount });

      toast({
        title: "Progress Updated",
        description: `Your progress for "${selectedGoal.title}" has been updated.`,
      });

      setShowUpdateProgressModal(false);
      setSelectedGoal(null);
      setAmountToAdd('');
      await loadGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (targetDate: Date) => {
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-zenith bg-clip-text text-transparent">
          Goals & Aspirations
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transform your dreams into achievable milestones. Track progress, build strategic plans, and reach your zenith.
        </p>
        <Button onClick={() => setShowAddModal(true)} className="bg-gradient-zenith hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Create New Goal
        </Button>
      </div>

      {/* Goals Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-fire-ring" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fire-ring">{goals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active aspirations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-earth-ring" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-earth-ring">
              {goals.filter(g => g.totalProgress >= g.targetAmount).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Goals achieved</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle shadow-soft hover:shadow-zenith transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-water-ring" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-water-ring">
              {formatCurrency(goals.reduce((sum, g) => sum + g.targetAmount, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Combined targets</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="text-center py-16 bg-gradient-subtle shadow-soft">
          <CardContent>
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-zenith rounded-full flex items-center justify-center">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-zenith bg-clip-text text-transparent">
                Begin Your Journey
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Every master starts with a vision. Create your first goal and begin the path to your zenith. 
                Transform dreams into reality through strategic planning and consistent action.
              </p>
              <Button onClick={() => setShowAddModal(true)} className="bg-gradient-zenith hover:opacity-90 px-8 py-3">
                <Plus className="mr-2 h-5 w-5" /> Create Your First Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.totalProgress, goal.targetAmount);
            const daysRemaining = getDaysRemaining(goal.targetDate);
            
            return (
              <Card key={goal.id} className={`relative overflow-hidden shadow-soft hover:shadow-zenith transition-all duration-300 border-l-4 ${
                progress >= 100 ? 'border-earth-ring bg-earth-ring/5' : 
                progress >= 75 ? 'border-water-ring bg-water-ring/5' : 
                progress >= 50 ? 'border-fire-ring bg-fire-ring/5' : 
                'border-void-ring bg-void-ring/5'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold">{goal.title}</CardTitle>
                        {progress >= 100 && <CheckCircle2 className="h-5 w-5 text-earth-ring" />}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={goal.category === 'financial' ? 'default' : 'secondary'} className="font-medium">
                        {goal.category}
                      </Badge>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                        progress >= 100 ? 'bg-earth-ring/20 text-earth-ring' :
                        progress >= 75 ? 'bg-water-ring/20 text-water-ring' :
                        progress >= 50 ? 'bg-fire-ring/20 text-fire-ring' :
                        'bg-void-ring/20 text-void-ring'
                      }`}>
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-earth-ring">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-earth-ring/70 to-earth-ring rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-bold text-primary">
                        ${goal.totalProgress.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / ${goal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    {goal.linkedAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Includes ${goal.linkedAmount.toLocaleString()} from linked income.
                      </p>
                    )}
                  </div>

                  {/* Time Remaining */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Goal deadline passed'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" aria-label={`Update progress for ${goal.title}`} onClick={() => { setSelectedGoal(goal); setShowUpdateProgressModal(true); }}>
                      Update Progress
                    </Button>
                    <Button variant="earth" size="sm" className="flex-1" aria-label={`View strategic plan for ${goal.title}`} onClick={() => { setSelectedGoal(goal); setShowStrategicPlanModal(true); }}>
                      Strategic Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Progress Modal */}
      <Dialog open={showUpdateProgressModal} onOpenChange={setShowUpdateProgressModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress for "{selectedGoal?.title}"</DialogTitle>
            <DialogDescription>Add to your current progress. Every step counts!</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="amount-to-add">Amount to Add</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="amount-to-add"
                type="number"
                step="0.01"
                placeholder="50.00"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateProgressModal(false)}>Cancel</Button>
            <Button variant="earth" onClick={handleUpdateProgress}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Strategic Plan Modal */}
      <Dialog open={showStrategicPlanModal} onOpenChange={setShowStrategicPlanModal}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Strategic Plan: {selectedGoal?.title}</DialogTitle>
            <DialogDescription>Break down your goal into actionable steps.</DialogDescription>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto pr-2 space-y-2">
            {strategicSteps.map(step => (
              <div key={step.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <button onClick={() => handleToggleStep(step)} aria-label={`Toggle step ${step.title}`}>
                  <CheckCircle2 className={`h-5 w-5 transition-colors ${step.isCompleted ? 'text-green-500' : 'text-muted-foreground'}`} />
                </button>
                <span className={`flex-grow ${step.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                  {step.title}
                </span>
                <button onClick={() => handleDeleteStep(step.id!)} aria-label={`Delete step ${step.title}`}>
                  <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                </button>
              </div>
            ))}
            {strategicSteps.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No steps created yet. Add your first step below!</p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Add a new strategic step..."
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
            />
            <Button onClick={handleAddStep} variant="earth">Add Step</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-subtle shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-fire-ring" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fire-ring">{goals.length}</div>
              <p className="text-xs text-muted-foreground">
                goals currently in pursuit
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-subtle shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-fire-ring" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fire-ring">
                {formatCurrency(goals.reduce((acc, goal) => acc + goal.currentAmount, 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                contributed across all goals
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-subtle shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Days Remaining</CardTitle>
              <Calendar className="h-4 w-4 text-fire-ring" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fire-ring">
                {Math.round(goals.reduce((acc, goal) => acc + getDaysRemaining(goal.targetDate), 0) / goals.length) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                average time to reach targets
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Goal Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[525px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Set New Goal</DialogTitle>
              <DialogDescription>
                Define your goal with clarity and purpose. What do you want to achieve?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="goal-title">Title</Label>
                <Input
                  id="goal-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Save for Vacation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-description">Description</Label>
                <Textarea
                  id="goal-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Why is this goal important to you?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-targetAmount">Target Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="goal-targetAmount"
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      placeholder="0.00"
                      className="pl-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal-currentAmount">Current Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="goal-currentAmount"
                      type="number"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                      placeholder="0.00"
                      className="pl-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: 'financial' | 'personal') =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="goal-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-targetDate">Target Date</Label>
                  <Input
                    id="goal-targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-date">Reminder (Optional)</Label>
                <Input
                  id="reminder-date"
                  type="datetime-local"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}