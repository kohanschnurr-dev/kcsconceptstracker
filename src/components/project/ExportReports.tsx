import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { getBudgetCategories } from '@/types';
import { toast } from 'sonner';
import { formatDisplayDateNumeric } from '@/lib/dateUtils';

interface Expense {
  id: string;
  amount: number;
  date: string;
  vendor_name: string | null;
  description: string | null;
  payment_method: string | null;
  category_id: string;
  includes_tax: boolean;
  tax_amount: number | null;
  status: string;
  expense_type?: string | null;
}

interface Category {
  id: string;
  category: string;
  estimated_budget: number;
  actualSpent: number;
}

interface Project {
  id: string;
  name: string;
  address: string;
  total_budget: number;
  start_date: string;
  status: string;
  purchase_price?: number | null;
  arv?: number | null;
}

interface ExportReportsProps {
  project: Project;
  categories: Category[];
  expenses: Expense[];
}

export function ExportReports({ project, categories, expenses }: ExportReportsProps) {
  const [exportType, setExportType] = useState<string>('expenses-csv');
  const [isExporting, setIsExporting] = useState(false);

  const getCategoryLabel = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return 'Unknown';
    return getBudgetCategories().find(b => b.value === cat.category)?.label || cat.category;
  };

  const getCategoryName = (categoryValue: string) => {
    return getBudgetCategories().find(b => b.value === categoryValue)?.label || categoryValue;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // CSV-safe currency: no commas, just $ and decimals
  const formatCurrencyForCSV = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return formatDisplayDateNumeric(date);
  };

  const calculateCategorySpending = () => {
    const spending: Record<string, number> = {};
    expenses.forEach(exp => {
      if (!spending[exp.category_id]) {
        spending[exp.category_id] = 0;
      }
      spending[exp.category_id] += Number(exp.amount);
    });
    return spending;
  };

  const exportExpensesCSV = () => {
    const headers = ['Date', 'Contractor', 'Category', 'Description', 'Type', 'Total', 'Payment Method'];
    const rows = expenses.map(exp => {
      const total = exp.includes_tax ? Number(exp.amount) + (Number(exp.tax_amount) || 0) : Number(exp.amount);
      const type = exp.expense_type ? exp.expense_type.charAt(0).toUpperCase() + exp.expense_type.slice(1) : '';
      return [
        formatDate(exp.date),
        exp.vendor_name || '',
        getCategoryLabel(exp.category_id),
        exp.description || '',
        type,
        formatCurrencyForCSV(total),
        exp.payment_method || '',
      ];
    });

    // Add totals row
    const grandTotal = expenses.reduce((sum, exp) => {
      const total = exp.includes_tax ? Number(exp.amount) + (Number(exp.tax_amount) || 0) : Number(exp.amount);
      return sum + total;
    }, 0);
    rows.push(['', '', '', 'TOTALS', '', formatCurrencyForCSV(grandTotal), '']);

    const csvContent = [
      `"Project:","${project.name}"`,
      `"Address:","${project.address}"`,
      `"Export Date:","${new Date().toLocaleDateString()}"`,
      '',
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    downloadFile(csvContent, `${project.name.replace(/\s+/g, '_')}_expenses_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const exportBudgetSummaryCSV = () => {
    const headers = ['Category', 'Estimated Budget', 'Actual Spent', 'Remaining', '% Left'];
    
    const rows = categories.map(cat => {
      const spent = cat.actualSpent || 0;
      const remaining = cat.estimated_budget - spent;
      const percentLeft = cat.estimated_budget > 0 ? ((remaining / cat.estimated_budget) * 100) : 0;
      return [
        getCategoryName(cat.category),
        formatCurrencyForCSV(cat.estimated_budget),
        formatCurrencyForCSV(spent),
        formatCurrencyForCSV(remaining),
        percentLeft.toFixed(1) + '%',
      ];
    });

    // Add totals
    const totalEstimated = categories.reduce((sum, cat) => sum + cat.estimated_budget, 0);
    const totalSpent = categories.reduce((sum, cat) => sum + (cat.actualSpent || 0), 0);
    const totalRemaining = totalEstimated - totalSpent;
    const totalPercentLeft = totalEstimated > 0 ? ((totalRemaining / totalEstimated) * 100) : 0;
    rows.push(['TOTALS', formatCurrencyForCSV(totalEstimated), formatCurrencyForCSV(totalSpent), formatCurrencyForCSV(totalRemaining), totalPercentLeft.toFixed(1) + '%']);

    const csvContent = [
      `"Project:","${project.name}"`,
      `"Address:","${project.address}"`,
      `"Total Budget:","${formatCurrencyForCSV(project.total_budget)}"`,
      `"Export Date:","${new Date().toLocaleDateString()}"`,
      '',
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    downloadFile(csvContent, `${project.name.replace(/\s+/g, '_')}_budget_summary_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const exportFullReportCSV = () => {
    const totalSpent = categories.reduce((sum, cat) => sum + (cat.actualSpent || 0), 0);
    const budgetUsedPercent = project.total_budget > 0 ? ((totalSpent / project.total_budget) * 100).toFixed(1) : '0.0';
    
    const lines = [
      '"=== PROJECT FINANCIAL REPORT ==="',
      '',
      '"PROJECT DETAILS"',
      `"Name","${project.name}"`,
      `"Address","${project.address}"`,
      `"Status","${project.status}"`,
      `"Start Date","${formatDate(project.start_date)}"`,
      `"Total Budget","${formatCurrencyForCSV(project.total_budget)}"`,
      `"Purchase Price","${project.purchase_price ? formatCurrencyForCSV(project.purchase_price) : 'N/A'}"`,
      `"ARV (After Repair Value)","${project.arv ? formatCurrencyForCSV(project.arv) : 'N/A'}"`,
      '',
      '"FINANCIAL SUMMARY"',
      `"Total Budget","${formatCurrencyForCSV(project.total_budget)}"`,
      `"Total Spent","${formatCurrencyForCSV(totalSpent)}"`,
      `"Remaining Budget","${formatCurrencyForCSV(project.total_budget - totalSpent)}"`,
      `"Budget Used","${budgetUsedPercent}%"`,
      '',
    ];

    // Profit analysis if ARV is available
    if (project.arv && project.purchase_price) {
      const totalInvestment = project.purchase_price + totalSpent;
      const projectedProfit = project.arv - totalInvestment;
      const roi = (projectedProfit / totalInvestment) * 100;
      lines.push(
        '"PROFIT ANALYSIS"',
        `"Purchase Price","${formatCurrencyForCSV(project.purchase_price)}"`,
        `"Renovation Costs","${formatCurrencyForCSV(totalSpent)}"`,
        `"Total Investment","${formatCurrencyForCSV(totalInvestment)}"`,
        `"ARV","${formatCurrencyForCSV(project.arv)}"`,
        `"Projected Profit","${formatCurrencyForCSV(projectedProfit)}"`,
        `"ROI","${roi.toFixed(1)}%"`,
        ''
      );
    }

    // Budget by category - with proper CSV quoting
    lines.push('"BUDGET BY CATEGORY"');
    lines.push('"Category","Estimated","Actual","Remaining","% Left"');
    categories.forEach(cat => {
      const spent = cat.actualSpent || 0;
      const remaining = cat.estimated_budget - spent;
      const percentLeft = cat.estimated_budget > 0 ? ((remaining / cat.estimated_budget) * 100) : 0;
      lines.push(`"${getCategoryName(cat.category)}","${formatCurrencyForCSV(cat.estimated_budget)}","${formatCurrencyForCSV(spent)}","${formatCurrencyForCSV(remaining)}","${percentLeft.toFixed(1)}%"`);
    });

    lines.push('');
    lines.push('"EXPENSE DETAILS"');
    lines.push('"Date","Contractor","Category","Description","Type","Total","Payment Method"');
    expenses.forEach(exp => {
      const total = exp.includes_tax ? Number(exp.amount) + (Number(exp.tax_amount) || 0) : Number(exp.amount);
      const type = exp.expense_type ? exp.expense_type.charAt(0).toUpperCase() + exp.expense_type.slice(1) : '';
      lines.push([
        formatDate(exp.date),
        exp.vendor_name || '',
        getCategoryLabel(exp.category_id),
        (exp.description || '').replace(/"/g, '""'),
        type,
        formatCurrencyForCSV(total),
        exp.payment_method || '',
      ].map(cell => `"${cell}"`).join(','));
    });

    lines.push('');
    lines.push(`"Report Generated:","${new Date().toLocaleString()}"`);

    downloadFile(lines.join('\n'), `${project.name.replace(/\s+/g, '_')}_full_report_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      switch (exportType) {
        case 'expenses-csv':
          exportExpensesCSV();
          toast.success('Expenses exported successfully');
          break;
        case 'budget-csv':
          exportBudgetSummaryCSV();
          toast.success('Budget summary exported successfully');
          break;
        case 'full-csv':
          exportFullReportCSV();
          toast.success('Full report exported successfully');
          break;
        default:
          toast.error('Invalid export type');
      }
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Reports
        </CardTitle>
        <CardDescription>
          Download project data for your accountant or CPA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              exportType === 'expenses-csv' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setExportType('expenses-csv')}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span className="font-medium">Expenses CSV</span>
            </div>
            <p className="text-xs text-muted-foreground">
              All expenses with dates, vendors, amounts, and tax details
            </p>
          </div>

          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              exportType === 'budget-csv' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setExportType('budget-csv')}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Budget Summary</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Budget vs actual by category with budget analysis
            </p>
          </div>

          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              exportType === 'full-csv' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setExportType('full-csv')}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Full Report</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Complete project financials, profit analysis, and all expenses
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{expenses.length}</span> expenses • 
            <span className="font-medium ml-1">{categories.length}</span> categories
          </div>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
