import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseDateString } from '@/lib/dateUtils';
import { MainLayout } from '@/components/layout/MainLayout';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { MonthlyView } from '@/components/calendar/MonthlyView';
import { WeeklyView } from '@/components/calendar/WeeklyView';
import { GanttView } from '@/components/calendar/GanttView';
import { TaskDetailPanel } from '@/components/calendar/TaskDetailPanel';
import { NewEventModal } from '@/components/calendar/NewEventModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCategoryGroup } from '@/lib/calendarCategories';

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
  category: string;
  dependsOn?: string[];
  checklist: { id: string; label: string; completed: boolean }[];
  notes: string;
  isCriticalPath?: boolean;
  eventCategory?: string;
  leadTimeDays?: number;
  expectedDate?: Date;
  recurrenceGroupId?: string | null;
}

interface Project {
  id: string;
  name: string;
  address: string;
  projectType?: 'fix_flip' | 'rental';
}

export default function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<CalendarView>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { toast } = useToast();

  const selectedProjectId = searchParams.get('project');

  const handleProjectFilterChange = (projectId: string | null) => {
    if (projectId) {
      setSearchParams({ project: projectId });
    } else {
      setSearchParams({});
    }
    if (selectedTask && projectId && selectedTask.projectId !== projectId) {
      setPanelOpen(false);
      setSelectedTask(null);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!selectedProjectId) return tasks;
    return tasks.filter(task => task.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name, address, project_type')
      .eq('status', 'active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsData) {
      const sortedProjects = projectsData
        .map(p => ({ ...p, projectType: p.project_type as 'fix_flip' | 'rental' }))
        .sort((a, b) => {
          if (a.projectType === 'fix_flip' && b.projectType !== 'fix_flip') return -1;
          if (a.projectType !== 'fix_flip' && b.projectType === 'fix_flip') return 1;
          return 0;
        });
      setProjects(sortedProjects);
      setAllProjects(sortedProjects);
    }

    const { data: allProjectsData } = await supabase
      .from('projects')
      .select('id, name, total_budget')
      .eq('user_id', user.id);

    const { data: eventsData, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return;
    }

    const { data: expensesData } = await supabase
      .from('expenses')
      .select('project_id, amount');

    const { data: categoriesData } = await supabase
      .from('project_categories')
      .select('project_id, estimated_budget');

    const projectBudgetHealth: Record<string, 'green' | 'yellow' | 'red'> = {};
    
    if (allProjectsData) {
      allProjectsData.forEach((project) => {
        const projectExpenses = expensesData?.filter(e => e.project_id === project.id) || [];
        const projectCategories = categoriesData?.filter(c => c.project_id === project.id) || [];
        
        const totalSpent = projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalBudget = projectCategories.reduce((sum, c) => sum + Number(c.estimated_budget), 0) || project.total_budget;
        const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        
        if (spentPercent > 100) projectBudgetHealth[project.id] = 'red';
        else if (spentPercent > 85) projectBudgetHealth[project.id] = 'yellow';
        else projectBudgetHealth[project.id] = 'green';
      });
    }

    const calendarTasks: CalendarTask[] = (eventsData || []).map((event: any) => {
      const project = allProjectsData?.find(p => p.id === event.project_id);
      
      return {
        id: event.id,
        projectId: event.project_id,
        projectName: project?.name || 'Unknown Project',
        title: event.title,
        startDate: parseDateString(event.start_date),
        endDate: parseDateString(event.end_date),
        status: getStatusFromCategory(event.event_category),
        budgetHealth: projectBudgetHealth[event.project_id] || 'green',
        category: event.event_category || 'due_diligence',
        checklist: Array.isArray(event.checklist) ? event.checklist : [],
        notes: event.notes || '',
        isCriticalPath: event.is_critical_path,
        eventCategory: event.event_category,
        leadTimeDays: event.lead_time_days,
        expectedDate: event.expected_date ? parseDateString(event.expected_date) : undefined,
        recurrenceGroupId: event.recurrence_group_id,
      };
    });

    setTasks(calendarTasks);
  };

  const getStatusFromCategory = (category: string): CalendarTask['status'] => {
    const group = getCategoryGroup(category);
    switch (group) {
      case 'acquisition_admin': return 'permitting';
      case 'structural_exterior': return 'demo';
      case 'rough_ins': return 'rough-in';
      case 'inspections': return 'permitting';
      case 'interior_finishes': return 'finish';
      case 'milestones': return 'complete';
      default: return 'rough-in';
    }
  };

  const handleTaskClick = (task: CalendarTask) => {
    setSelectedTask(task);
    setPanelOpen(true);
  };

  const handleTaskUpdate = async (updatedTask: CalendarTask) => {
    const { error } = await supabase
      .from('calendar_events')
      .update({
        notes: updatedTask.notes,
        checklist: updatedTask.checklist,
      })
      .eq('id', updatedTask.id);

    if (error) {
      console.error('Error updating event:', error);
      toast({ title: 'Error', description: 'Failed to update event', variant: 'destructive' });
      return;
    }

    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleTaskMove = async (taskId: string, newStartDate: Date, newEndDate: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from('calendar_events')
      .update({
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error moving event:', error);
      toast({ title: 'Error', description: 'Failed to move event', variant: 'destructive' });
      return;
    }

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, startDate: newStartDate, endDate: newEndDate } : t
      )
    );

    toast({ title: 'Event Updated', description: `Moved "${task.title}" to new dates.` });
  };

  return (
    <MainLayout>
      <div className="flex flex-col min-h-[calc(100vh-10rem)] gap-4">
        <CalendarHeader
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          projects={allProjects}
          selectedProjectId={selectedProjectId}
          onProjectFilterChange={handleProjectFilterChange}
          onAddEvent={
            <NewEventModal 
              projects={projects} 
              onEventCreated={fetchData}
              defaultProjectId={selectedProjectId || undefined}
            />
          }
        />

        {/* Category Legend (desktop only; mobile legend is inside CalendarHeader) */}
        <div className="hidden sm:block bg-background rounded-lg p-4 border border-border">
          <CalendarLegend />
        </div>

        <div className="bg-background rounded-xl border border-border overflow-hidden flex-1 flex flex-col">
          {view === 'monthly' && (
            <MonthlyView
              currentDate={currentDate}
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
              onDateChange={setCurrentDate}
            />
          )}
          {view === 'weekly' && (
            <WeeklyView
              currentDate={currentDate}
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
            />
          )}
          {view === 'gantt' && (
            <GanttView
              currentDate={currentDate}
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
            />
          )}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-background/50 rounded-xl border border-border">
            <p className="text-muted-foreground mb-2">
              {selectedProjectId ? 'No events for this project' : 'No events scheduled'}
            </p>
            <p className="text-sm text-muted-foreground">
              Click "Add Project Event" to create your first calendar entry
            </p>
          </div>
        )}
      </div>

      <TaskDetailPanel
        task={selectedTask}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={(deletedIds) => {
          setTasks(prev => prev.filter(t => !deletedIds.includes(t.id)));
          setSelectedTask(null);
        }}
        allTasks={filteredTasks}
      />
    </MainLayout>
  );
}
