import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseDateString } from '@/lib/dateUtils';
import { MainLayout } from '@/components/layout/MainLayout';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { MonthlyView } from '@/components/calendar/MonthlyView';

import { GanttView } from '@/components/calendar/GanttView';
import { TaskDetailPanel } from '@/components/calendar/TaskDetailPanel';
import { NewEventModal } from '@/components/calendar/NewEventModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCategoryGroup } from '@/lib/calendarCategories';
import { syncLinkedTaskDate } from '@/lib/syncLinkedTask';
import { useProfile } from '@/hooks/useProfile';

const DEFAULT_PROJECT_TYPE_ORDER = ['fix_flip', 'new_construction', 'rental'];

export type CalendarView = 'monthly' | 'gantt';

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
  isCompleted?: boolean;
  completedAt?: string | null;
  linkedTaskId?: string | null;
  owner?: string | null;
  dependencies?: { taskId: string; type: 'FS' | 'SS' | 'FF' | 'SF' }[];
}

interface Project {
  id: string;
  name: string;
  address: string;
  projectType?: 'fix_flip' | 'rental' | 'new_construction';
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
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateDate, setQuickCreateDate] = useState<Date | undefined>();
  const [quickCreateProjectId, setQuickCreateProjectId] = useState<string | undefined>();
  const { toast } = useToast();
  const { profile } = useProfile();

  const projectTypeOrder = useMemo(() => {
    const saved = (profile?.project_tab_order as string[] | null) ?? [];
    const merged = [...saved];
    for (const t of DEFAULT_PROJECT_TYPE_ORDER) if (!merged.includes(t)) merged.push(t);
    return merged;
  }, [profile?.project_tab_order]);

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

  // Re-sort projects whenever the user's saved tab order changes (e.g. profile loads after fetch)
  useEffect(() => {
    const resort = (list: Project[]) => [...list].sort((a, b) => {
      const aIdx = projectTypeOrder.indexOf(a.projectType as string);
      const bIdx = projectTypeOrder.indexOf(b.projectType as string);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
    setProjects(prev => resort(prev));
    setAllProjects(prev => resort(prev));
  }, [projectTypeOrder]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, address, project_type')
        .eq('status', 'active')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsData) {
        const mapped = projectsData
          .map(p => ({ ...p, projectType: p.project_type as 'fix_flip' | 'rental' | 'new_construction' }));
        const sortedProjects = [...mapped].sort((a, b) => {
          const aIdx = projectTypeOrder.indexOf(a.projectType as string);
          const bIdx = projectTypeOrder.indexOf(b.projectType as string);
          return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
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
          isCompleted: event.is_completed || false,
          completedAt: event.completed_at,
          linkedTaskId: event.linked_task_id,
          owner: event.owner || null,
          dependencies: Array.isArray(event.dependencies)
            ? event.dependencies.map((d: any) => ({ taskId: d.taskId || d.task_id, type: d.type }))
            : [],
        };
      });

      setTasks(calendarTasks);
    } catch (err) {
      console.error('Calendar fetchData error:', err);
      toast({ title: 'Error', description: 'Failed to load calendar data', variant: 'destructive' });
    }
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

    await syncLinkedTaskDate(taskId, newStartDate);

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


        <div className="bg-background rounded-xl border border-border overflow-hidden flex-1 flex flex-col">
          {view === 'monthly' && (
            <MonthlyView
              currentDate={currentDate}
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
              onDateChange={setCurrentDate}
              onDayDoubleClick={(date) => {
                setQuickCreateDate(date);
                // Use setTimeout to ensure state is set before modal reads it
                setTimeout(() => setQuickCreateOpen(true), 0);
              }}
            />
          )}
          {view === 'gantt' && (
            <GanttView
              currentDate={currentDate}
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
              onAddEvent={(projectId) => {
                setQuickCreateProjectId(projectId);
                setQuickCreateOpen(true);
              }}
            />
          )}
        </div>

        {/* Category Legend below the grid */}
        <div className="hidden sm:block bg-background rounded-lg p-4 border border-border">
          <CalendarLegend />
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

      <NewEventModal
        projects={projects}
        onEventCreated={fetchData}
        defaultProjectId={quickCreateProjectId || selectedProjectId || undefined}
        externalOpen={quickCreateOpen}
        onExternalOpenChange={(open) => {
          setQuickCreateOpen(open);
          if (!open) setQuickCreateProjectId(undefined);
        }}
        defaultStartDate={quickCreateDate}
        allTasks={tasks}
      />
    </MainLayout>
  );
}
