import { useMemo } from 'react';
import { format } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
import { Printer, FileDown, Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { generatePDF } from '@/lib/pdfExport';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface DBProject {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'complete' | 'on_hold';
  project_type: string;
  total_budget: number;
  start_date: string;
  purchase_price?: number;
  arv?: number;
  completed_date?: string | null;
}

interface DBCategory {
  id: string;
  project_id: string;
  category: string;
  estimated_budget: number;
  actualSpent: number;
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
  status: string;
}

interface ProjectReportProps {
  project: DBProject;
  categories: DBCategory[];
  expenses: DBExpense[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export function ProjectReport({ project, categories, expenses, open, onOpenChange }: ProjectReportProps) {
  const { companyName, logoUrl } = useCompanySettings();

  const categoryTotal = categories.reduce((s, c) => s + Number(c.estimated_budget), 0);
  const totalBudget = project.total_budget > 0 ? project.total_budget : categoryTotal;
  const totalSpent = categories.reduce((s, c) => s + c.actualSpent, 0);
  const remaining = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const roi = useMemo(() => {
    if (project.arv && project.purchase_price && project.purchase_price > 0) {
      const profit = project.arv - project.purchase_price - totalSpent;
      return (profit / (project.purchase_price + totalSpent)) * 100;
    }
    return null;
  }, [project.arv, project.purchase_price, totalSpent]);

  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [expenses]
  );

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach(c => { m[c.id] = c.category; });
    return m;
  }, [categories]);

  const vendorTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      const name = e.vendor_name || 'Unknown';
      map[name] = (map[name] || 0) + Number(e.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const startDate = parseDateString(project.start_date);
  const now = new Date();
  const daysElapsed = startDate ? Math.floor((now.getTime() - startDate.getTime()) / 86400000) : 0;
  const endDate = project.completed_date ? parseDateString(project.completed_date) : null;
  const daysRemaining = endDate ? Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 86400000)) : null;

  const budgetColor = pct > 100 ? 'bg-destructive' : pct >= 85 ? 'bg-warning' : 'bg-success';

  const maxCatSpent = Math.max(...categories.map(c => c.actualSpent), 1);

  const handlePrint = () => window.print();

  const handleDownloadPdf = () => {
    const lines: string[] = [];
    lines.push(project.name);
    lines.push(`Address: ${project.address}`);
    lines.push(`Status: ${project.status.replace('_', ' ')}`);
    lines.push(`Start Date: ${startDate ? format(startDate, 'MMM d, yyyy') : project.start_date}`);
    lines.push('');
    lines.push('FINANCIAL SNAPSHOT');
    lines.push(`Total Budget: ${fmt(totalBudget)}`);
    lines.push(`Total Spent: ${fmt(totalSpent)}`);
    lines.push(`Remaining: ${fmt(remaining)}`);
    if (roi !== null) lines.push(`Estimated ROI: ${roi.toFixed(1)}%`);
    lines.push('');
    lines.push('CATEGORY SPEND BREAKDOWN');
    categories.filter(c => c.estimated_budget > 0 || c.actualSpent > 0).forEach(c => {
      lines.push(`${c.category.replace(/_/g, ' ')}: ${fmt(c.actualSpent)} / ${fmt(c.estimated_budget)}`);
    });
    lines.push('');
    lines.push('RECENT ACTIVITY');
    recentExpenses.forEach(e => {
      const d = parseDateString(e.date);
      lines.push(`${d ? format(d, 'MM/dd/yyyy') : e.date}  ${e.vendor_name || '—'}  ${categoryMap[e.category_id] || '—'}  ${fmt(e.amount)}`);
    });
    lines.push('');
    lines.push('TEAM SUMMARY');
    vendorTotals.forEach(([name, total]) => {
      lines.push(`${name}: ${fmt(total)}`);
    });
    lines.push('');
    lines.push(`TOTAL SPENT: ${fmt(totalSpent)}`);

    generatePDF(lines.join('\n'), {
      docType: 'Project Report',
      companyName: companyName || 'My Company',
      logoUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full print:overflow-visible">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 print:hidden">
          <DialogTitle className="text-xl">Project Report</DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <FileDown className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>
        </DialogHeader>

        {/* 1. Project Header */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground text-sm">{project.address}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge className={cn(
              project.status === 'active' && 'bg-success/20 text-success border-success/30',
              project.status === 'complete' && 'bg-primary/20 text-primary border-primary/30',
              project.status === 'on_hold' && 'bg-warning/20 text-warning border-warning/30',
            )}>
              {project.status.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Started {startDate ? format(startDate, 'MMM d, yyyy') : project.start_date}
            </span>
            <span className="text-xs text-muted-foreground">
              Report generated {format(now, 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* 2. Financial Snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
              <p className="text-lg font-bold">{fmt(totalBudget)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
              <p className="text-lg font-bold">{fmt(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className={cn('text-lg font-bold', remaining >= 0 ? 'text-success' : 'text-destructive')}>
                {fmt(remaining)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Est. ROI</p>
              <p className={cn('text-lg font-bold', roi !== null && roi >= 0 ? 'text-success' : 'text-destructive')}>
                {roi !== null ? `${roi.toFixed(1)}%` : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 3. Budget Progress Bar */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Budget Usage</span>
              <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', budgetColor)}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Category Spend Breakdown */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Category Spend Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories
              .filter(c => c.estimated_budget > 0 || c.actualSpent > 0)
              .sort((a, b) => b.actualSpent - a.actualSpent)
              .map(c => {
                const catPct = c.estimated_budget > 0 ? (c.actualSpent / c.estimated_budget) * 100 : 0;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{c.category.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">
                        {fmt(c.actualSpent)} / {fmt(c.estimated_budget)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          catPct > 100 ? 'bg-destructive' : catPct >= 85 ? 'bg-warning' : 'bg-primary'
                        )}
                        style={{ width: `${Math.min(catPct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {categories.filter(c => c.estimated_budget > 0 || c.actualSpent > 0).length === 0 && (
              <p className="text-xs text-muted-foreground">No category data available.</p>
            )}
          </CardContent>
        </Card>

        {/* 5. Timeline Summary */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Timeline Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Start Date</p>
                <p className="font-medium">{startDate ? format(startDate, 'MMM d, yyyy') : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">End Date</p>
                <p className="font-medium">{endDate ? format(endDate, 'MMM d, yyyy') : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Days Elapsed</p>
                <p className="font-medium">{daysElapsed}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Days Remaining</p>
                <p className="font-medium">{daysRemaining !== null ? daysRemaining : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Recent Activity Log */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-2 pr-2">Date</th>
                      <th className="text-left py-2 pr-2">Vendor</th>
                      <th className="text-left py-2 pr-2">Category</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExpenses.map(e => {
                      const d = parseDateString(e.date);
                      return (
                        <tr key={e.id} className="border-b last:border-b-0">
                          <td className="py-2 pr-2 text-xs">{d ? format(d, 'MM/dd/yy') : e.date}</td>
                          <td className="py-2 pr-2 text-xs">{e.vendor_name || '—'}</td>
                          <td className="py-2 pr-2 text-xs capitalize">{(categoryMap[e.category_id] || '—').replace(/_/g, ' ')}</td>
                          <td className="py-2 text-xs text-right font-medium">{fmt(e.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No expenses recorded yet.</p>
            )}
          </CardContent>
        </Card>

        {/* 7. Team Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Team Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {vendorTotals.length > 0 ? (
              <div className="space-y-2">
                {vendorTotals.map(([name, total]) => (
                  <div key={name} className="flex justify-between items-center text-sm">
                    <span>{name}</span>
                    <span className="font-medium">{fmt(total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No vendor data available.</p>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
