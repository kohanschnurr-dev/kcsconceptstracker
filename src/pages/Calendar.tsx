import { useState, useEffect, useMemo } from 'react';
import { parseISO } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
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
  category: string; // Now using category instead of trade
  dependsOn?: string[];
  checklist: { id: string; label: string; completed: boolean }[];
  notes: string;
  isCriticalPath?: boolean;
  eventCategory?: string;
  leadTimeDays?: number;
  expectedDate?: Date;
}

interface Project {
  id: string;
  name: string;
  address: string;
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

  // Get project filter from URL
  const selectedProjectId = searchParams.get('project');

  // Handle project filter change with URL sync
  const handleProjectFilterChange = (projectId: string | null) => {
    if (projectId) {
      setSearchParams({ project: projectId });
    } else {
      setSearchParams({});
    }
    // Close the side panel if a different project is selected
    if (selectedTask && projectId && selectedTask.projectId !== projectId) {
      setPanelOpen(false);
      setSelectedTask(null);
    }
  };

  // Filter tasks based on selected project
  const filteredTasks = useMemo(() => {
    if (!selectedProjectId) return tasks;
    return tasks.filter(task => task.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch active projects for the dropdown
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name, address')
      .eq('status', 'active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsData) {
      setProjects(projectsData);
      setAllProjects(projectsData);
    }

    // Fetch all projects for task names
    const { data: allProjectsData } = await supabase
      .from('projects')
      .select('id, name, total_budget')
      .eq('user_id', user.id);

    // Fetch calendar events from the database for current user
    const { data: eventsData, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return;
    }

    // Fetch expense data for budget health calculation
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('project_id, amount');

    const { data: categoriesData } = await supabase
      .from('project_categories')
      .select('project_id, estimated_budget');

    // Calculate budget health per project
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

    // Transform database events to CalendarTask format
    const calendarTasks: CalendarTask[] = (eventsData || []).map((event: any) => {
      const project = allProjectsData?.find(p => p.id === event.project_id);
      
      return {
        id: event.id,
        projectId: event.project_id,
        projectName: project?.name || 'Unknown Project',
        title: event.title,
        startDate: parseISO(event.start_date),
        endDate: parseISO(event.end_date),
        status: getStatusFromCategory(event.event_category),
        budgetHealth: projectBudgetHealth[event.project_id] || 'green',
        category: event.event_category || 'due_diligence',
        checklist: Array.isArray(event.checklist) ? event.checklist : [],
        notes: event.notes || '',
        isCriticalPath: event.is_critical_path,
        eventCategory: event.event_category,
        leadTimeDays: event.lead_time_days,
        expectedDate: event.expected_date ? parseISO(event.expected_date) : undefined,
      };
    });

    setTasks(calendarTasks);
  };

  const getStatusFromCategory = (category: string): CalendarTask['status'] => {
    const group = getCategoryGroup(category);
    switch (group) {
      case 'acquisition_admin':
        return 'permitting';
      case 'structural_exterior':
        return 'demo';
      case 'rough_ins':
        return 'rough-in';
      case 'inspections':
        return 'permitting';
      case 'interior_finishes':
        return 'finish';
      case 'milestones':
        return 'complete';
      default:
        return 'rough-in';
    }
  };

  const handleTaskClick = (task: CalendarTask) => {
    setSelectedTask(task);
    setPanelOpen(true);
  };

  const handleTaskUpdate = async (updatedTask: CalendarTask) => {
    // Update in database
    const { error } = await supabase
      .from('calendar_events')
      .update({
        notes: updatedTask.notes,
        checklist: updatedTask.checklist,
      })
      .eq('id', updatedTask.id);

    if (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
      return;
    }

    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleTaskMove = async (taskId: string, newStartDate: Date, newEndDate: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Update in database
    const { error } = await supabase
      .from('calendar_events')
      .update({
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error moving event:', error);
      toast({
        title: 'Error',
        description: 'Failed to move event',
        variant: 'destructive',
      });
      return;
    }

    // Update local state
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, startDate: newStartDate, endDate: newEndDate } : t
      )
    );

    toast({
      title: 'Event Updated',
      description: `Moved "${task.title}" to new dates.`,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-4">
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

        {/* Category Legend */}
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <CalendarLegend />
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {view === 'monthly' && (
            <MonthlyView
              currentDate={currentDate}
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
            />
          )}
          {view === 'weekly' && (
            <WeeklyView
              currentDate={currentDate}
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
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
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <p className="text-slate-400 mb-2">
              {selectedProjectId ? 'No events for this project' : 'No events scheduled'}
            </p>
            <p className="text-sm text-slate-500">
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
        onTaskDelete={(taskId) => {
          setTasks(prev => prev.filter(t => t.id !== taskId));
          setSelectedTask(null);
        }}
        allTasks={filteredTasks}
      />
    </MainLayout>
  );
}