import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { MonthlyView } from '@/components/calendar/MonthlyView';
import { WeeklyView } from '@/components/calendar/WeeklyView';
import { GanttView } from '@/components/calendar/GanttView';
import { TaskDetailPanel } from '@/components/calendar/TaskDetailPanel';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/types';

export type CalendarView = 'monthly' | 'weekly' | 'gantt';

export interface CalendarTask {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: 'permitting' | 'demo' | 'rough-in' | 'finish' | 'complete';
  budgetHealth: 'green' | 'yellow' | 'red';
  trade: 'demo' | 'plumbing' | 'electrical' | 'structural' | 'hvac' | 'drywall' | 'finish' | 'general';
  dependsOn?: string[];
  checklist: { id: string; label: string; completed: boolean }[];
  notes: string;
}

export default function Calendar() {
  const [view, setView] = useState<CalendarView>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsData) {
      const transformed: Project[] = projectsData.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        totalBudget: p.total_budget,
        startDate: p.start_date,
        status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
        projectType: p.project_type as 'fix_flip' | 'rental',
        categories: [],
      }));
      setProjects(transformed);

      // Fetch milestones - cast to any to handle dynamic table
      let milestonesData: any[] = [];
      try {
        const { data } = await supabase
          .from('milestones' as any)
          .select('*')
          .order('sort_order', { ascending: true });
        milestonesData = data || [];
      } catch (e) {
        console.log('Milestones table may not exist');
      }

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('project_id, amount');

      const { data: categoriesData } = await supabase
        .from('project_categories')
        .select('*');

      const generatedTasks: CalendarTask[] = [];
      
      projectsData.forEach((project) => {
        const projectMilestones = (milestonesData || []).filter((m: any) => m.project_id === project.id);
        const projectExpenses = expensesData?.filter(e => e.project_id === project.id) || [];
        const projectCategories = categoriesData?.filter(c => c.project_id === project.id) || [];
        
        const totalSpent = projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalBudget = projectCategories.reduce((sum, c) => sum + Number(c.estimated_budget), 0) || project.total_budget;
        const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        
        let budgetHealth: 'green' | 'yellow' | 'red' = 'green';
        if (spentPercent > 100) budgetHealth = 'red';
        else if (spentPercent > 85) budgetHealth = 'yellow';

        // Create tasks from milestones
        projectMilestones.forEach((milestone: any, index: number) => {
          const dueDate = new Date(milestone.due_date);
          const startDate = new Date(dueDate);
          startDate.setDate(startDate.getDate() - 3);

          const trade = getTradeFromTitle(milestone.title);
          const status = milestone.completed_at ? 'complete' : getStatusFromIndex(index, projectMilestones.length);

          generatedTasks.push({
            id: milestone.id,
            projectId: project.id,
            projectName: project.name,
            title: milestone.title,
            startDate,
            endDate: dueDate,
            status,
            budgetHealth,
            trade,
            dependsOn: index > 0 ? [projectMilestones[index - 1].id] : undefined,
            checklist: generateChecklist(trade),
            notes: milestone.description || '',
          });
        });

        // If no milestones, create default project task
        if (projectMilestones.length === 0) {
          const startDate = new Date(project.start_date);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 30);

          generatedTasks.push({
            id: project.id,
            projectId: project.id,
            projectName: project.name,
            title: project.name,
            startDate,
            endDate,
            status: project.status === 'complete' ? 'complete' : 'rough-in',
            budgetHealth,
            trade: 'general',
            checklist: [],
            notes: '',
          });
        }
      });

      setTasks(generatedTasks);
    }
  };

  const getTradeFromTitle = (title: string): CalendarTask['trade'] => {
    const lower = title.toLowerCase();
    if (lower.includes('demo') || lower.includes('demolition')) return 'demo';
    if (lower.includes('plumb') || lower.includes('pipe')) return 'plumbing';
    if (lower.includes('electric') || lower.includes('wire')) return 'electrical';
    if (lower.includes('foundation') || lower.includes('structural') || lower.includes('frame')) return 'structural';
    if (lower.includes('hvac') || lower.includes('ac') || lower.includes('heat')) return 'hvac';
    if (lower.includes('drywall') || lower.includes('sheetrock')) return 'drywall';
    if (lower.includes('finish') || lower.includes('paint') || lower.includes('floor')) return 'finish';
    return 'general';
  };

  const getStatusFromIndex = (index: number, total: number): CalendarTask['status'] => {
    const progress = index / total;
    if (progress < 0.2) return 'permitting';
    if (progress < 0.4) return 'demo';
    if (progress < 0.7) return 'rough-in';
    return 'finish';
  };

  const generateChecklist = (trade: CalendarTask['trade']) => {
    const checklists: Record<string, string[]> = {
      demo: ['Obtain demo permit', 'Disconnect utilities', 'Set up dumpster', 'Complete hazmat check'],
      plumbing: ['Verify 3/4" supply lines', 'Check for cast iron replacement', 'Pressure test completed', 'Inspection scheduled'],
      electrical: ['Panel upgrade assessed', 'GFCI in wet areas', 'Smoke detector placement', 'Load calculation verified'],
      structural: ['Verify 3/4" rebar spacing', 'Foundation pier check', 'Engineer approval obtained', 'Beam sizing confirmed'],
      hvac: ['Unit sizing calculated', 'Ductwork layout approved', 'Return air adequate', 'Thermostat location set'],
      drywall: ['Insulation inspection complete', 'Vapor barrier installed', 'Backing for fixtures', 'Fire blocking verified'],
      finish: ['Paint colors approved', 'Flooring acclimated', 'Hardware selection final', 'Final punch list ready'],
      general: ['Scope defined', 'Budget approved', 'Timeline confirmed', 'Crew assigned'],
    };

    return (checklists[trade] || checklists.general).map((label, i) => ({
      id: `${trade}-${i}`,
      label,
      completed: false,
    }));
  };

  const handleTaskClick = (task: CalendarTask) => {
    setSelectedTask(task);
    setPanelOpen(true);
  };

  const handleTaskUpdate = (updatedTask: CalendarTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleTaskMove = (taskId: string, newStartDate: Date, newEndDate: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const daysDiff = Math.floor((newStartDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check order of operations
    const dependentTasks = tasks.filter(t => t.dependsOn?.includes(taskId));
    const warnings: string[] = [];

    // Check if moving would violate dependencies
    const prerequisiteTasks = tasks.filter(t => task.dependsOn?.includes(t.id));
    for (const prereq of prerequisiteTasks) {
      if (newStartDate < prereq.endDate) {
        warnings.push(`Warning: "${task.title}" starts before "${prereq.title}" ends. This violates order of operations.`);
      }
    }

    // Update the task and shift dependent tasks
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          return { ...t, startDate: newStartDate, endDate: newEndDate };
        }
        // Shift dependent tasks
        if (t.dependsOn?.includes(taskId)) {
          const newStart = new Date(t.startDate);
          const newEnd = new Date(t.endDate);
          newStart.setDate(newStart.getDate() + daysDiff);
          newEnd.setDate(newEnd.getDate() + daysDiff);
          return { ...t, startDate: newStart, endDate: newEnd };
        }
        return t;
      });
      return updated;
    });

    if (warnings.length > 0) {
      toast({
        title: 'Order of Operations Warning',
        description: warnings[0],
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Task Updated',
        description: `Moved "${task.title}" and ${dependentTasks.length} dependent tasks.`,
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <CalendarHeader
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {view === 'monthly' && (
            <MonthlyView
              currentDate={currentDate}
              tasks={tasks}
              onTaskClick={handleTaskClick}
            />
          )}
          {view === 'weekly' && (
            <WeeklyView
              currentDate={currentDate}
              tasks={tasks}
              onTaskClick={handleTaskClick}
            />
          )}
          {view === 'gantt' && (
            <GanttView
              currentDate={currentDate}
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
            />
          )}
        </div>
      </div>

      <TaskDetailPanel
        task={selectedTask}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onTaskUpdate={handleTaskUpdate}
        allTasks={tasks}
      />
    </MainLayout>
  );
}
