import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Home, Hammer, Building2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { NewProjectModal } from '@/components/NewProjectModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Project, CategoryBudget, ProjectType } from '@/types';

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
  const [mainTab, setMainTab] = useState<'fix_flip' | 'rental' | 'new_construction'>('fix_flip');
  const [statusTab, setStatusTab] = useState('all');
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

      // Get expenses to calculate actual spent (from both regular expenses and QuickBooks)
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
      // Include QuickBooks imported expenses
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

        // Calculate total budget from sum of category estimated budgets
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

  const fixFlipProjects = getFilteredProjects('fix_flip');
  const rentalProjects = getFilteredProjects('rental');
  const newConstructionProjects = getFilteredProjects('new_construction');

  const getStatusCounts = (type: ProjectType) => {
    const typeProjects = projects.filter(p => p.projectType === type);
    return {
      total: typeProjects.length,
      active: typeProjects.filter(p => p.status === 'active').length,
      complete: typeProjects.filter(p => p.status === 'complete').length,
    };
  };

  const fixFlipCounts = getStatusCounts('fix_flip');
  const rentalCounts = getStatusCounts('rental');
  const newConstructionCounts = getStatusCounts('new_construction');

  const renderProjectGrid = (filteredProjects: Project[], type: ProjectType) => {
    const counts = type === 'fix_flip' ? fixFlipCounts : type === 'rental' ? rentalCounts : newConstructionCounts;
    const typeLabel = type === 'fix_flip' ? 'fix & flip' : type === 'rental' ? 'rental' : 'new construction';
    const createLabel = type === 'fix_flip' ? 'Flip' : type === 'rental' ? 'Rental' : 'Build';
    
    return (
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
            <TabsTrigger value="complete">Complete ({counts.complete})</TabsTrigger>
          </TabsList>
        </Tabs>

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
                  {counts.total === 0 
                    ? `No ${typeLabel} projects yet` 
                    : 'No projects match your search'}
                </p>
                {counts.total === 0 && (
                  <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First {createLabel}
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
        {/* Header */}
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

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Main Type Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => { setMainTab(v as 'fix_flip' | 'rental' | 'new_construction'); setStatusTab('all'); }}>
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="fix_flip" className="gap-2">
              <Hammer className="h-4 w-4" />
              Fix & Flips ({fixFlipCounts.total})
            </TabsTrigger>
            <TabsTrigger value="rental" className="gap-2">
              <Home className="h-4 w-4" />
              Rentals ({rentalCounts.total})
            </TabsTrigger>
            <TabsTrigger value="new_construction" className="gap-2">
              <Building2 className="h-4 w-4" />
              New Builds ({newConstructionCounts.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fix_flip" className="mt-6">
            {renderProjectGrid(fixFlipProjects, 'fix_flip')}
          </TabsContent>

          <TabsContent value="rental" className="mt-6">
            {renderProjectGrid(rentalProjects, 'rental')}
          </TabsContent>

          <TabsContent value="new_construction" className="mt-6">
            {renderProjectGrid(newConstructionProjects, 'new_construction')}
          </TabsContent>
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
