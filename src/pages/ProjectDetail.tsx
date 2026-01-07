import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Clock
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockProjects, mockExpenses, mockDailyLogs } from '@/data/mockData';
import { BUDGET_CATEGORIES, TEXAS_SALES_TAX } from '@/types';
import { cn } from '@/lib/utils';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const project = mockProjects.find(p => p.id === id);
  const projectExpenses = mockExpenses.filter(e => e.projectId === id);
  const projectLogs = mockDailyLogs.filter(l => l.projectId === id);

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

  const totalSpent = project.categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const percentSpent = (totalSpent / project.totalBudget) * 100;
  const remaining = project.totalBudget - totalSpent;

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

  const getStatusIcon = () => {
    switch (project.status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'complete':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVarianceStatus = (actual: number, estimated: number) => {
    const variance = ((actual - estimated) / estimated) * 100;
    if (variance > 5) return 'over';
    if (variance < -5) return 'under';
    return 'on-track';
  };

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
                    project.status === 'on-hold' && 'bg-warning/20 text-warning border-warning/30'
                  )}
                >
                  {getStatusIcon()}
                  {project.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {project.address}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Started {formatDate(project.startDate)}
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
                  <p className="text-xl font-semibold font-mono">{formatCurrency(project.totalBudget)}</p>
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
                  <p className="text-xl font-semibold">{projectExpenses.length}</p>
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
                <span className="font-mono">{formatCurrency(totalSpent)} / {formatCurrency(project.totalBudget)}</span>
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
            <TabsTrigger value="expenses">Expenses ({projectExpenses.length})</TabsTrigger>
            <TabsTrigger value="logs">Daily Logs ({projectLogs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
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
                      {project.categories.map((cat) => {
                        const label = BUDGET_CATEGORIES.find(b => b.value === cat.category)?.label || cat.category;
                        const variance = cat.actualSpent - cat.estimatedBudget;
                        const variancePercent = cat.estimatedBudget > 0 
                          ? ((variance / cat.estimatedBudget) * 100).toFixed(1)
                          : '0';
                        const progress = cat.estimatedBudget > 0 
                          ? (cat.actualSpent / cat.estimatedBudget) * 100 
                          : 0;
                        const remaining = cat.estimatedBudget - cat.actualSpent;
                        const status = getVarianceStatus(cat.actualSpent, cat.estimatedBudget);

                        return (
                          <TableRow key={cat.id}>
                            <TableCell className="font-medium">{label}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(cat.estimatedBudget)}
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
                {projectExpenses.length === 0 ? (
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
                        {projectExpenses.map((expense) => {
                          const category = project.categories.find(c => c.id === expense.categoryId);
                          const categoryLabel = category 
                            ? BUDGET_CATEGORIES.find(b => b.value === category.category)?.label 
                            : 'Unknown';
                          const totalAmount = expense.includesTax 
                            ? expense.amount 
                            : expense.amount * (1 + TEXAS_SALES_TAX);

                          return (
                            <TableRow key={expense.id}>
                              <TableCell>{formatDate(expense.date)}</TableCell>
                              <TableCell className="font-medium">{expense.vendorName}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{categoryLabel}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(expense.amount)}
                                {expense.includesTax && (
                                  <span className="text-xs text-muted-foreground ml-1">(incl. tax)</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{expense.paymentMethod}</Badge>
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
                {projectLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No daily logs recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {projectLogs.map((log) => (
                      <div key={log.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList className="h-4 w-4 text-primary" />
                          <span className="font-medium">{formatDate(log.date)}</span>
                        </div>
                        {log.workPerformed && (
                          <div className="mb-2">
                            <p className="text-sm text-muted-foreground">Work Performed:</p>
                            <p className="text-sm">{log.workPerformed}</p>
                          </div>
                        )}
                        {log.issues && (
                          <div className="p-2 rounded bg-warning/10 border border-warning/20">
                            <p className="text-sm text-warning flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Issue: {log.issues}
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
