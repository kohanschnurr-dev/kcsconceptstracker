import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Home, Hammer, Building2, Handshake } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { NewProjectModal } from '@/components/NewProjectModal';
import { SortableTab } from '@/components/projects/SortableTab';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import type { Project, CategoryBudget, ProjectType } from '@/types';

interface DBCategory {
  id: string;
  project_id: string;
  category: string;
  estimated_budget: number;
}

const DEFAULT_TAB_ORDER: ProjectType[] = ['fix_flip', 'rental', 'new_construction', 'wholesaling'];

const TAB_CONFIG: Record<string, { label: string; icon: typeof Hammer; createLabel: string }> = {
  fix_flip: { label: 'Fix & Flips', icon: Hammer, createLabel: 'Flip' },
  rental: { label: 'Rentals', icon: Home, createLabel: 'Rental' },
  new_construction: { label: 'New Builds', icon: Building2, createLabel: 'Build' },
  wholesaling: { label: 'Wholesaling', icon: Handshake, createLabel: 'Deal' },
};

export default function Projects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateTabOrder } = useProfile();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const tabOrder = useMemo<ProjectType[]>(() => {
    const saved = profile?.project_tab_order as string[] | null;
    if (saved && Array.isArray(saved) && saved.length === 4) {
      return saved as ProjectType[];
    }
    return DEFAULT_TAB_ORDER;
  }, [profile?.project_tab_order]);

  const [mainTab, setMainTab] = useState<ProjectType>(tabOrder[0]);

  // Update mainTab when tabOrder loads from profile
  useEffect(() => {
    setMainTab(tabOrder[0]);
  }, [tabOrder]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('project_categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('category_id, amount');

      const { data: qbExpensesData } = await supabase
        .from('quickbooks_expenses')
        .select('category_id, amount')
        .eq('is_imported', true);

      const expensesByCategory: Record<string, number> = {};
      (expensesData || []).forEach(e => {
        expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
      });
      (qbExpensesData || []).forEach(e => {
        if (e.category_id) {
          expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
        }
      });

      const transformedProjects: Project[] = (projectsData || []).map((p) => {
        const projectCategories = (categoriesData || [])
          .filter((c: DBCategory) => c.project_id === p.id)
          .map((c: DBCategory) => ({
            id: c.id,
            projectId: c.project_id,
            category: c.category as CategoryBudget['category'],
            estimatedBudget: c.estimated_budget,
            actualSpent: expensesByCategory[c.id] || 0,
          }));

        const calculatedTotalBudget = projectCategories.reduce(
          (sum, cat) => sum + cat.estimatedBudget,
          0
        );

        return {
          id: p.id,
          name: p.name,
          address: p.address,
          totalBudget: calculatedTotalBudget,
          startDate: p.start_date,
          status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
          projectType: (p.project_type || 'fix_flip') as ProjectType,
          categories: projectCategories,
          coverPhotoPath: p.cover_photo_path || undefined,
        };
      });

      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredProjects = (type: ProjectType) => {
    return projects.filter((project) => {
      const matchesType = project.projectType === type;
      const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.address.toLowerCase().includes(search.toLowerCase());
      
      if (statusTab === 'all') return matchesType && matchesSearch;
      return matchesType && matchesSearch && project.status === statusTab;
    });
  };

  const getStatusCounts = (type: ProjectType) => {
    const typeProjects = projects.filter(p => p.projectType === type);
    return {
      total: typeProjects.length,
      active: typeProjects.filter(p => p.status === 'active').length,
      complete: typeProjects.filter(p => p.status === 'complete').length,
    };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tabOrder.indexOf(active.id as ProjectType);
    const newIndex = tabOrder.indexOf(over.id as ProjectType);
    const newOrder = arrayMove(tabOrder, oldIndex, newIndex);

    updateTabOrder.mutate(newOrder);
  };

  const renderProjectGrid = (type: ProjectType) => {
    const filteredProjects = getFilteredProjects(type);
    const counts = getStatusCounts(type);
    const config = TAB_CONFIG[type];
    
    return (
      <div className="space-y-4">
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
            <TabsTrigger value="complete">Complete ({counts.complete})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="h-2 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12 glass-card">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">
                  {counts.total === 0 
                    ? `No ${config.label.toLowerCase()} projects yet` 
                    : 'No projects match your search'}
                </p>
                {counts.total === 0 && (
                  <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First {config.createLabel}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your properties</p>
          </div>
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={mainTab} onValueChange={(v) => { setMainTab(v as ProjectType); setStatusTab('all'); }}>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tabOrder} strategy={horizontalListSortingStrategy}>
              <TabsList className="w-full max-w-2xl flex">
                {tabOrder.map((type) => {
                  const config = TAB_CONFIG[type];
                  const counts = getStatusCounts(type);
                  return (
                    <SortableTab
                      key={type}
                      id={type}
                      value={type}
                      label={config.label}
                      icon={config.icon}
                      count={counts.total}
                    />
                  );
                })}
              </TabsList>
            </SortableContext>
          </DndContext>

          {tabOrder.map((type) => (
            <TabsContent key={type} value={type} className="mt-6">
              {renderProjectGrid(type)}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <NewProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onProjectCreated={fetchProjects}
        defaultProjectType={mainTab}
      />
    </MainLayout>
  );
}
