import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Home, Hammer, Building2, Handshake, HardHat, Settings, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NewProjectModal } from '@/components/NewProjectModal';
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

const DEFAULT_TAB_ORDER: ProjectType[] = ['fix_flip', 'rental', 'new_construction', 'wholesaling', 'contractor'];

const TAB_CONFIG: Record<string, { label: string; icon: typeof Hammer; createLabel: string }> = {
  fix_flip: { label: 'Fix & Flips', icon: Hammer, createLabel: 'Flip' },
  rental: { label: 'Rentals', icon: Home, createLabel: 'Rental' },
  new_construction: { label: 'New Builds', icon: Building2, createLabel: 'Build' },
  wholesaling: { label: 'Wholesaling', icon: Handshake, createLabel: 'Deal' },
  contractor: { label: 'Contractor', icon: HardHat, createLabel: 'Job' },
};

export default function Projects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateTabOrder, starredProjects, isProjectStarred, toggleStarProject, hiddenProjectTabs, updateHiddenTabs } = useProfile();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);

  const tabOrder = useMemo<ProjectType[]>(() => {
    const saved = profile?.project_tab_order as string[] | null;
    if (saved && Array.isArray(saved) && saved.length >= 4) {
      // Append any new default tabs not in saved order
      const merged = [...saved as ProjectType[]];
      for (const tab of DEFAULT_TAB_ORDER) {
        if (!merged.includes(tab)) merged.push(tab);
      }
      return merged as ProjectType[];
      return saved as ProjectType[];
    }
    return DEFAULT_TAB_ORDER;
  }, [profile?.project_tab_order]);

  const visibleTabs = useMemo(() => {
    return tabOrder.filter(tab => !hiddenProjectTabs.includes(tab));
  }, [tabOrder, hiddenProjectTabs]);

  const [mainTab, setMainTab] = useState<ProjectType>(tabOrder[0]);

  // Update mainTab when tabOrder/visibility changes
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(mainTab)) {
      setMainTab(visibleTabs[0]);
    }
  }, [visibleTabs, mainTab]);

  useEffect(() => {
    if (visibleTabs.length > 0) {
      setMainTab(visibleTabs[0]);
    }
  }, []);

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
        .select('category_id, amount, project_id, cost_type');

      const { data: qbExpensesData } = await supabase
        .from('quickbooks_expenses')
        .select('category_id, amount, project_id, cost_type')
        .eq('is_imported', true);

      const expensesByCategory: Record<string, number> = {};
      const constructionByProject: Record<string, number> = {};
      const transactionByProject: Record<string, number> = {};
      const holdingByProject: Record<string, number> = {};
      (expensesData || []).forEach(e => {
        expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
        if (!e.cost_type || e.cost_type === 'construction') {
          constructionByProject[e.project_id] = (constructionByProject[e.project_id] || 0) + Number(e.amount);
        }
        if (e.cost_type === 'transaction') {
          transactionByProject[e.project_id] = (transactionByProject[e.project_id] || 0) + Number(e.amount);
        }
        if (e.cost_type === 'monthly') {
          holdingByProject[e.project_id] = (holdingByProject[e.project_id] || 0) + Number(e.amount);
        }
      });
      (qbExpensesData || []).forEach(e => {
        if (e.category_id) {
          expensesByCategory[e.category_id] = (expensesByCategory[e.category_id] || 0) + Number(e.amount);
        }
        if (e.project_id) {
          if (!e.cost_type || e.cost_type === 'construction') {
            constructionByProject[e.project_id] = (constructionByProject[e.project_id] || 0) + Number(e.amount);
          }
          if (e.cost_type === 'transaction') {
            transactionByProject[e.project_id] = (transactionByProject[e.project_id] || 0) + Number(e.amount);
          }
          if (e.cost_type === 'monthly') {
            holdingByProject[e.project_id] = (holdingByProject[e.project_id] || 0) + Number(e.amount);
          }
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
        const effectiveTotalBudget = (p.total_budget ?? 0) > 0 ? p.total_budget : calculatedTotalBudget;

        return {
          id: p.id,
          name: p.name,
          address: p.address,
          totalBudget: effectiveTotalBudget,
          startDate: p.start_date,
          status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
          projectType: (p.project_type || 'fix_flip') as ProjectType,
          categories: projectCategories,
          coverPhotoPath: p.cover_photo_path || undefined,
          coverPhotoPosition: p.cover_photo_position || undefined,
          completedDate: (p as any).completed_date || undefined,
          monthlyRent: p.monthly_rent ?? undefined,
          loanAmount: p.loan_amount ?? undefined,
          interestRate: p.interest_rate ?? undefined,
          loanTermYears: p.loan_term_years ?? undefined,
          annualPropertyTaxes: p.annual_property_taxes ?? undefined,
          annualInsurance: p.annual_insurance ?? undefined,
          annualHoa: p.annual_hoa ?? undefined,
          vacancyRate: p.vacancy_rate ?? undefined,
          monthlyMaintenance: p.monthly_maintenance ?? undefined,
          managementRate: p.management_rate ?? undefined,
          cashflowRehabOverride: p.cashflow_rehab_override ?? null,
          arv: p.arv ?? 0,
          purchasePrice: p.purchase_price ?? 0,
          constructionSpent: constructionByProject[p.id] || 0,
          closingCostsPct: p.closing_costs_pct ?? undefined,
          closingCostsMode: p.closing_costs_mode || 'pct',
          closingCostsFlat: p.closing_costs_flat ?? undefined,
          holdingCostsPct: p.holding_costs_pct ?? undefined,
          holdingCostsMode: p.holding_costs_mode || 'pct',
          holdingCostsFlat: p.holding_costs_flat ?? undefined,
          transactionCostActual: transactionByProject[p.id] || 0,
          holdingCostActual: holdingByProject[p.id] || 0,
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

  const handleToggleStar = (projectId: string) => {
    if (!isProjectStarred(projectId) && starredProjects.length >= 3) {
      toast({ title: 'Limit reached', description: 'You can star up to 3 projects', variant: 'destructive' });
      return;
    }
    toggleStarProject.mutate(projectId);
  };

  const getFilteredProjects = (type: ProjectType) => {
    const filtered = projects.filter((project) => {
      const matchesType = project.projectType === type;
      const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.address.toLowerCase().includes(search.toLowerCase());
      
      if (statusTab === 'all') return matchesType && matchesSearch;
      return matchesType && matchesSearch && project.status === statusTab;
    });

    // Sort: starred first (in saved order), then by start date descending
    return filtered.sort((a, b) => {
      const aStarIdx = starredProjects.indexOf(a.id);
      const bStarIdx = starredProjects.indexOf(b.id);
      const aStarred = aStarIdx >= 0;
      const bStarred = bStarIdx >= 0;
      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;
      if (aStarred && bStarred) return aStarIdx - bStarIdx;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
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

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newOrder = arrayMove(tabOrder, index, newIndex);
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
                  isStarred={isProjectStarred(project.id)}
                  onToggleStar={handleToggleStar}
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
          <div className="flex items-center gap-2">
            <TabsList>
              {visibleTabs.map((type) => {
                const config = TAB_CONFIG[type];
                const counts = getStatusCounts(type);
                const Icon = config.icon;
                return (
                  <TabsTrigger key={type} value={type} className="gap-1.5">
                    <Icon className="h-4 w-4" />
                    {config.label} ({counts.total})
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <Popover open={reorderOpen} onOpenChange={setReorderOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <p className="text-xs text-muted-foreground mb-2 px-2">Tab Order & Visibility</p>
                {tabOrder.map((type, index) => {
                  const Icon = TAB_CONFIG[type].icon;
                  const isHidden = hiddenProjectTabs.includes(type);
                  const visibleCount = tabOrder.filter(t => !hiddenProjectTabs.includes(t)).length;
                  const isLastVisible = !isHidden && visibleCount <= 1;
                  return (
                    <div key={type} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted">
                      <span className={cn("text-sm flex items-center gap-2", isHidden && "text-muted-foreground/50")}>
                        <Icon className="h-3.5 w-3.5" />
                        {TAB_CONFIG[type].label}
                      </span>
                      <div className="flex gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          disabled={isLastVisible}
                          onClick={() => {
                            const newHidden = isHidden
                              ? hiddenProjectTabs.filter(t => t !== type)
                              : [...hiddenProjectTabs, type];
                            updateHiddenTabs.mutate(newHidden);
                          }}
                          title={isHidden ? 'Show tab' : 'Hide tab'}
                        >
                          {isHidden ? <EyeOff className="h-3 w-3 text-muted-foreground/50" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6"
                          disabled={index === 0} onClick={() => moveTab(index, 'up')}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6"
                          disabled={index === tabOrder.length - 1} onClick={() => moveTab(index, 'down')}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>

          {visibleTabs.map((type) => (
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
