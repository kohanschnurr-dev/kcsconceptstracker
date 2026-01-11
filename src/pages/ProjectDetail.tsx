import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BUDGET_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DBProject {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'complete' | 'on_hold';
  total_budget: number;
  start_date: string;
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
  const [dailyLogs, setDailyLogs] = useState<DBDailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      // Fetch project
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
      
      // Fetch categories, expenses, and logs in parallel
      const [categoriesRes, expensesRes, logsRes] = await Promise.all([
        supabase.from('project_categories').select('*').eq('project_id', id),
        supabase.from('expenses').select('*').eq('project_id', id).order('date', { ascending: false }),
        supabase.from('daily_logs').select('*').eq('project_id', id).order('date', { ascending: false })
      ]);
      
      const categoriesData = categoriesRes.data || [];
      const expensesData = expensesRes.data || [];
      
      // Calculate actual spent per category
      const categoriesWithSpent = categoriesData.map(cat => {
        const categoryExpenses = expensesData.filter(e => e.category_id === cat.id);
        const actualSpent = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        return { ...cat, actualSpent };
      });
      
      setCategories(categoriesWithSpent);
      setExpenses(expensesData);
      setDailyLogs(logsRes.data || []);
      setLoading(false);
    };
    
    fetchProjectData();
  }, [id]);

  const totalSpent = categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const percentSpent = project ? (totalSpent / project.total_budget) * 100 : 0;
  const remaining = project ? project.total_budget - totalSpent : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  const getVarianceStatus = (actual: number, estimated: number) => {
    if (estimated === 0) return 'on-track';
    const variance = ((actual - estimated) / estimated) * 100;
    if (variance > 5) return 'over';
    if (variance < -5) return 'under';
    return 'on-track';
  };

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
                <Badge
                  className={cn(
                    'gap-1',
                    project.status === 'active' && 'bg-success/20 text-success border-success/30',
                    project.status === 'complete' && 'bg-primary/20 text-primary border-primary/30',
                    project.status === 'on_hold' && 'bg-warning/20 text-warning border-warning/30'
                  )}
                >
                  {getStatusIcon(project.status)}
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {project.address}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Started {formatDate(project.start_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-xl font-semibold font-mono">{formatCurrency(project.total_budget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
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

          <Card className="glass-card">
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

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="text-xl font-semibold">{expenses.length}</p>
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
                <span className="font-mono">{formatCurrency(totalSpent)} / {formatCurrency(project.total_budget)}</span>
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

        {/* Tabs for detailed views */}
        <Tabs defaultValue="breakdown" className="space-y-4">
          <TabsList>
            <TabsTrigger value="breakdown">Budget Breakdown</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
            <TabsTrigger value="logs">Daily Logs ({dailyLogs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No budget categories set up yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Estimated</TableHead>
                          <TableHead className="text-right">Actual</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead className="text-right">Remaining</TableHead>
                          <TableHead>Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((cat) => {
                          const label = BUDGET_CATEGORIES.find(b => b.value === cat.category)?.label || cat.category;
                          const variance = cat.actualSpent - cat.estimated_budget;
                          const variancePercent = cat.estimated_budget > 0 
                            ? ((variance / cat.estimated_budget) * 100).toFixed(1)
                            : '0';
                          const progress = cat.estimated_budget > 0 
                            ? (cat.actualSpent / cat.estimated_budget) * 100 
                            : 0;
                          const remaining = cat.estimated_budget - cat.actualSpent;
                          const status = getVarianceStatus(cat.actualSpent, cat.estimated_budget);

                          return (
                            <TableRow key={cat.id}>
                              <TableCell className="font-medium">{label}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(cat.estimated_budget)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(cat.actualSpent)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={cn(
                                  'font-mono',
                                  status === 'over' && 'text-destructive',
                                  status === 'under' && 'text-success',
                                  status === 'on-track' && 'text-muted-foreground'
                                )}>
                                  {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                                  <span className="text-xs ml-1">({variancePercent}%)</span>
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={cn(
                                  'font-mono',
                                  remaining < 0 ? 'text-destructive' : 'text-success'
                                )}>
                                  {formatCurrency(remaining)}
                                </span>
                              </TableCell>
                              <TableCell className="w-32">
                                <div className="progress-bar">
                                  <div
                                    className={cn(
                                      'progress-fill',
                                      progress > 105 ? 'bg-destructive' : progress > 90 ? 'bg-warning' : 'bg-success'
                                    )}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Expenses</CardTitle>
                <Button size="sm" asChild>
                  <Link to="/expenses">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No expenses recorded yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Payment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => {
                          const category = categories.find(c => c.id === expense.category_id);
                          const categoryLabel = category 
                            ? BUDGET_CATEGORIES.find(b => b.value === category.category)?.label 
                            : 'Unknown';

                          return (
                            <TableRow key={expense.id}>
                              <TableCell>{formatDate(expense.date)}</TableCell>
                              <TableCell className="font-medium">{expense.vendor_name || '-'}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{expense.description || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{categoryLabel}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(expense.amount)}
                                {expense.includes_tax && (
                                  <span className="text-xs text-muted-foreground ml-1">(incl. tax)</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{expense.payment_method || '-'}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
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
