import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { parseDateString, formatDisplayDate } from '@/lib/dateUtils';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Receipt,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BUDGET_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { PhotoGallery } from '@/components/project/PhotoGallery';
import { DocumentsGallery } from '@/components/project/DocumentsGallery';

import { ProfitCalculator } from '@/components/project/ProfitCalculator';
import { CashFlowCalculator } from '@/components/project/CashFlowCalculator';
import { HardMoneyLoanCalculator } from '@/components/project/HardMoneyLoanCalculator';
import { ProjectCalendar } from '@/components/project/ProjectCalendar';
import { ProjectTasks } from '@/components/project/ProjectTasks';

import { ProjectVendors } from '@/components/project/ProjectVendors';
import { ExportReports } from '@/components/project/ExportReports';
import { useToast } from '@/hooks/use-toast';

interface DBProject {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'complete' | 'on_hold';
  project_type: 'fix_flip' | 'rental' | 'new_construction' | 'wholesaling';
  total_budget: number;
  start_date: string;
  purchase_price?: number;
  arv?: number;
  // Rental-specific fields
  monthly_rent?: number;
  loan_amount?: number;
  interest_rate?: number;
  loan_term_years?: number;
  annual_property_taxes?: number;
  annual_insurance?: number;
  annual_hoa?: number;
  vacancy_rate?: number;
  monthly_maintenance?: number;
  management_rate?: number;
}

interface DBCategory {
  id: string;
  project_id: string;
  category: string;
  estimated_budget: number;
}

interface DBExpense {
  id: string;
  project_id: string;
  category_id: string;
  vendor_name: string | null;
  description: string | null;
  amount: number;
  date: string;
  payment_method: string | null;
  includes_tax: boolean;
  tax_amount: number | null;
  status: string;
}

interface DBDailyLog {
  id: string;
  project_id: string;
  date: string;
  work_performed: string | null;
  issues: string | null;
  contractors_on_site: string[] | null;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<DBProject | null>(null);
  const [categories, setCategories] = useState<(DBCategory & { actualSpent: number })[]>([]);
  const [expenses, setExpenses] = useState<DBExpense[]>([]);
  const [allExpensesForExport, setAllExpensesForExport] = useState<DBExpense[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DBDailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (projectError) {
        console.error('Error fetching project:', projectError);
        setLoading(false);
        return;
      }
      
      if (!projectData) {
        setLoading(false);
        return;
      }
      
      setProject(projectData);
      
      const [categoriesRes, expensesRes, qbExpensesRes, logsRes] = await Promise.all([
        supabase.from('project_categories').select('*').eq('project_id', id),
        supabase.from('expenses').select('*').eq('project_id', id).order('date', { ascending: false }),
        supabase.from('quickbooks_expenses').select('*').eq('project_id', id).eq('is_imported', true).order('date', { ascending: false }),
        supabase.from('daily_logs').select('*').eq('project_id', id).order('date', { ascending: false })
      ]);
      
      const categoriesData = categoriesRes.data || [];
      const expensesData = expensesRes.data || [];
      const qbExpensesData = qbExpensesRes.data || [];
      
      // Combine regular expenses and QuickBooks expenses for category calculations
      const allExpensesByCategoryId: Record<string, number> = {};
      expensesData.forEach(e => {
        allExpensesByCategoryId[e.category_id] = (allExpensesByCategoryId[e.category_id] || 0) + Number(e.amount);
      });
      qbExpensesData.forEach(e => {
        if (e.category_id) {
          allExpensesByCategoryId[e.category_id] = (allExpensesByCategoryId[e.category_id] || 0) + Number(e.amount);
        }
      });
      
      const categoriesWithSpent = categoriesData.map(cat => {
        const actualSpent = allExpensesByCategoryId[cat.id] || 0;
        return { ...cat, actualSpent };
      });
      
      // Combine manual + QB expenses for export (convert QB expenses to match format)
      const qbExpensesConverted: DBExpense[] = qbExpensesData
        .filter(qb => qb.category_id) // Only include assigned QB expenses
        .map(qb => ({
          id: qb.id,
          project_id: qb.project_id || id,
          category_id: qb.category_id!,
          vendor_name: qb.vendor_name,
          description: qb.description,
          amount: qb.amount,
          date: qb.date,
          payment_method: qb.payment_method,
          includes_tax: false,
          tax_amount: null,
          status: 'actual',
        }));
      
      const combinedExpenses = [...expensesData, ...qbExpensesConverted];
      
      setCategories(categoriesWithSpent);
      setExpenses(expensesData);
      setAllExpensesForExport(combinedExpenses);
      setDailyLogs(logsRes.data || []);
      setLoading(false);
    };
    
    fetchProjectData();
  }, [id]);

  // Calculate total budget from sum of category budgets (not project.total_budget)
  // This keeps it in sync with the Budget & Expenses page
  const totalBudget = categories.reduce((sum, cat) => sum + Number(cat.estimated_budget), 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalSpent;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return formatDisplayDate(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'complete':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'complete' | 'on_hold') => {
    if (!project || newStatus === project.status) return;
    
    setUpdatingStatus(true);
    
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', project.id);
    
    if (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project status',
        variant: 'destructive',
      });
    } else {
      setProject({ ...project, status: newStatus });
      toast({
        title: 'Status updated',
        description: `Project marked as ${newStatus.replace('_', ' ')}`,
      });
    }
    
    setUpdatingStatus(false);
  };

  const handleConvertToRental = async () => {
    if (!project) return;
    
    const { error } = await supabase
      .from('projects')
      .update({ project_type: 'rental', status: 'active' })
      .eq('id', project.id);
    
    if (error) {
      console.error('Error converting to rental:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert project to rental',
        variant: 'destructive',
      });
    } else {
      setProject({ ...project, project_type: 'rental', status: 'active' });
      toast({
        title: 'Converted to Rental',
        description: 'This project is now a rental property',
      });
    }
  };

  const isRental = project?.project_type === 'rental';

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">This project doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            className="w-fit gap-2 -ml-2"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold">{project.name}</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={updatingStatus}>
                    <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                      <Badge
                        className={cn(
                          'gap-1 cursor-pointer hover:opacity-80 transition-opacity',
                          project.status === 'active' && 'bg-success/20 text-success border-success/30',
                          project.status === 'complete' && 'bg-primary/20 text-primary border-primary/30',
                          project.status === 'on_hold' && 'bg-warning/20 text-warning border-warning/30'
                        )}
                      >
                        {updatingStatus ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          getStatusIcon(project.status)
                        )}
                        {project.status.replace('_', ' ')}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Badge>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange('active')}
                      className={cn(project.status === 'active' && 'bg-muted')}
                    >
                      <Clock className="h-4 w-4 mr-2 text-success" />
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange('complete')}
                      className={cn(project.status === 'complete' && 'bg-muted')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                      Complete
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange('on_hold')}
                      className={cn(project.status === 'on_hold' && 'bg-muted')}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2 text-warning" />
                      On Hold
                    </DropdownMenuItem>
                    {!isRental && project.status === 'complete' && (
                      <>
                        <div className="my-1 border-t border-border" />
                        <DropdownMenuItem onClick={handleConvertToRental}>
                          <Home className="h-4 w-4 mr-2 text-blue-500" />
                          Convert to Rental
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {project.address}
                </span>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                      <Calendar className="h-4 w-4" />
                      Started {formatDate(project.start_date)}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={parseDateString(project.start_date)}
                      onSelect={async (date) => {
                        if (!date) return;
                        const newDate = format(date, 'yyyy-MM-dd');
                        const { error } = await supabase
                          .from('projects')
                          .update({ start_date: newDate })
                          .eq('id', project.id);
                        
                        if (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to update start date',
                            variant: 'destructive',
                          });
                        } else {
                          setProject({ ...project, start_date: newDate });
                          toast({
                            title: 'Date updated',
                            description: `Start date changed to ${format(date, 'MMM d, yyyy')}`,
                          });
                        }
                        setDatePopoverOpen(false);
                      }}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards - Clickable - Navigate to Budget Page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="glass-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-primary/50"
            onClick={() => navigate(`/projects/${id}/budget`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-xl font-semibold font-mono">{formatCurrency(totalBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-warning/50"
            onClick={() => navigate(`/projects/${id}/budget`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-xl font-semibold font-mono">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-success/50"
            onClick={() => navigate(`/projects/${id}/budget`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  remaining >= 0 ? "bg-success/10" : "bg-destructive/10"
                )}>
                  {remaining >= 0 ? (
                    <TrendingDown className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className={cn(
                    "text-xl font-semibold font-mono",
                    remaining >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-muted-foreground/50"
            onClick={() => navigate(`/projects/${id}/budget`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="text-xl font-semibold">{allExpensesForExport.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{percentSpent.toFixed(1)}% of budget used</span>
                <span className="font-mono">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
              </div>
              <div className="progress-bar h-3">
                <div
                  className={cn(
                    'progress-fill',
                    percentSpent > 100 ? 'bg-destructive' : percentSpent > 90 ? 'bg-warning' : 'bg-success'
                  )}
                  style={{ width: `${Math.min(percentSpent, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Tabs for detailed views - Schedule first (most used for active projects) */}
        <Tabs defaultValue="schedule" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="logs">Logs ({dailyLogs.length})</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            {!isRental && <TabsTrigger value="loan">Loan</TabsTrigger>}
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <ProjectTasks projectId={id!} projectName={project.name} />
          </TabsContent>

          <TabsContent value="schedule">
            <ProjectCalendar 
              projectId={id!} 
              projectName={project.name}
              projectAddress={project.address}
            />
          </TabsContent>

          <TabsContent value="financials" className="space-y-6">
            {isRental ? (
              <CashFlowCalculator 
                projectId={id!}
                totalBudget={totalBudget}
                totalSpent={totalSpent}
                initialPurchasePrice={project.purchase_price || 0}
                initialArv={project.arv || 0}
                initialMonthlyRent={project.monthly_rent || 0}
                initialLoanAmount={project.loan_amount || 0}
                initialInterestRate={project.interest_rate || 0}
                initialLoanTermYears={project.loan_term_years || 30}
                initialAnnualPropertyTaxes={project.annual_property_taxes || 0}
                initialAnnualInsurance={project.annual_insurance || 0}
                initialAnnualHoa={project.annual_hoa || 0}
                initialVacancyRate={project.vacancy_rate || 8}
                initialMonthlyMaintenance={project.monthly_maintenance || 0}
                initialManagementRate={project.management_rate || 10}
              />
            ) : (
              <ProfitCalculator 
                projectId={id!}
                totalBudget={totalBudget}
                totalSpent={totalSpent}
                initialPurchasePrice={project.purchase_price || 0}
                initialArv={project.arv || 0}
              />
            )}
            
            <ExportReports 
              project={{
                id: project.id,
                name: project.name,
                address: project.address,
                total_budget: totalBudget,
                start_date: project.start_date,
                status: project.status,
                purchase_price: project.purchase_price,
                arv: project.arv,
              }}
              categories={categories}
              expenses={allExpensesForExport}
            />
          </TabsContent>

          {!isRental && (
            <TabsContent value="loan">
              <HardMoneyLoanCalculator
                projectId={id!}
                purchasePrice={project.purchase_price || 0}
                totalBudget={totalBudget}
                arv={project.arv || 0}
                initialLoanAmount={(project as any).hm_loan_amount}
                initialInterestRate={(project as any).hm_interest_rate || 12}
                initialLoanTermMonths={(project as any).hm_loan_term_months || 6}
                initialPoints={(project as any).hm_points || 3}
                initialClosingCosts={(project as any).hm_closing_costs || 0}
                initialInterestOnly={(project as any).hm_interest_only ?? true}
              />
            </TabsContent>
          )}

          <TabsContent value="team">
            <ProjectVendors projectId={id!} />
          </TabsContent>

          <TabsContent value="photos">
            <PhotoGallery projectId={id!} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsGallery projectId={id!} />
          </TabsContent>

          <TabsContent value="logs">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Daily Logs</CardTitle>
                <Button size="sm" asChild>
                  <Link to="/logs">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {dailyLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No daily logs recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {dailyLogs.map((log) => (
                      <div key={log.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList className="h-4 w-4 text-primary" />
                          <span className="font-medium">{formatDate(log.date)}</span>
                        </div>
                        {log.work_performed && (
                          <div className="mb-2">
                            <p className="text-sm text-muted-foreground">Work Performed:</p>
                            <p className="text-sm">{log.work_performed}</p>
                          </div>
                        )}
                        {log.issues && (
                          <div className="p-2 rounded bg-warning/10 border border-warning/20">
                            <p className="text-sm text-warning flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Issues: {log.issues}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
