import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewProjectModal } from '@/components/NewProjectModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Project, CategoryBudget } from '@/types';

interface DBCategory {
  id: string;
  project_id: string;
  category: string;
  estimated_budget: number;
}

export default function Projects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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

      // Get expenses to calculate actual spent
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('category_id, amount');

      const expensesByCategory: Record<string, number> = {};
      (expensesData || []).forEach(e => {
        expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
      });

      const transformedProjects: Project[] = (projectsData || []).map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        totalBudget: p.total_budget,
        startDate: p.start_date,
        status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
        categories: (categoriesData || [])
          .filter((c: DBCategory) => c.project_id === p.id)
          .map((c: DBCategory) => ({
            id: c.id,
            projectId: c.project_id,
            category: c.category as CategoryBudget['category'],
            estimatedBudget: c.estimated_budget,
            actualSpent: expensesByCategory[c.id] || 0,
          })),
      }));

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

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.address.toLowerCase().includes(search.toLowerCase());
    
    if (tab === 'all') return matchesSearch;
    return matchesSearch && project.status === tab;
  });

  const activeCount = projects.filter(p => p.status === 'active').length;
  const completeCount = projects.filter(p => p.status === 'complete').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your fix & flip properties</p>
          </div>
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All ({projects.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
              <TabsTrigger value="complete">Complete ({completeCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State */}
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
            {/* Projects Grid */}
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
                  {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
                </p>
                {projects.length === 0 && (
                  <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Project
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <NewProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onProjectCreated={fetchProjects}
      />
    </MainLayout>
  );
}
