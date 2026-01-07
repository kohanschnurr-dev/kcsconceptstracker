import { useState } from 'react';
import { Plus, Search, Filter, Download, Receipt } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockExpenses, mockProjects } from '@/data/mockData';
import { BUDGET_CATEGORIES, TEXAS_SALES_TAX } from '@/types';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import { cn } from '@/lib/utils';

export default function Expenses() {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProjectName = (projectId: string) => {
    return mockProjects.find(p => p.id === projectId)?.name || projectId;
  };

  const getCategoryLabel = (categoryId: string, projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    const category = project?.categories.find(c => c.id === categoryId);
    if (!category) return categoryId;
    return BUDGET_CATEGORIES.find(b => b.value === category.category)?.label || category.category;
  };

  const filteredExpenses = mockExpenses.filter((expense) => {
    const matchesSearch = 
      expense.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      expense.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesProject = projectFilter === 'all' || expense.projectId === projectFilter;
    
    // For category filter, we need to check the category of the expense
    let matchesCategory = categoryFilter === 'all';
    if (!matchesCategory) {
      const project = mockProjects.find(p => p.id === expense.projectId);
      const category = project?.categories.find(c => c.id === expense.categoryId);
      matchesCategory = category?.category === categoryFilter;
    }

    return matchesSearch && matchesProject && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Expenses</h1>
            <p className="text-muted-foreground mt-1">Track all project costs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="gap-2" onClick={() => setExpenseModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {mockProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {BUDGET_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {filteredExpenses.length} expenses
              </p>
              <p className="text-xl font-semibold font-mono">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>TX Sales Tax (8.25%)</p>
            <p className="font-mono text-foreground">
              {formatCurrency(filteredExpenses.filter(e => e.includesTax).reduce((sum, e) => sum + (e.taxAmount || 0), 0))}
            </p>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-muted/30">
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="whitespace-nowrap">{formatDate(expense.date)}</td>
                    <td>
                      <div>
                        <p className="font-medium">{expense.vendorName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {expense.description}
                        </p>
                      </div>
                    </td>
                    <td>{getProjectName(expense.projectId)}</td>
                    <td>
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryLabel(expense.categoryId, expense.projectId)}
                      </Badge>
                    </td>
                    <td className="capitalize">{expense.paymentMethod}</td>
                    <td className="text-right font-mono">
                      {formatCurrency(expense.amount)}
                      {expense.includesTax && (
                        <span className="text-xs text-muted-foreground ml-1">+tax</span>
                      )}
                    </td>
                    <td>
                      <Badge
                        variant="outline"
                        className={cn(
                          expense.status === 'actual' 
                            ? 'bg-success/10 text-success border-success/30'
                            : 'bg-warning/10 text-warning border-warning/30'
                        )}
                      >
                        {expense.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No expenses found</p>
            </div>
          )}
        </div>
      </div>

      <QuickExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        projects={mockProjects}
      />
    </MainLayout>
  );
}
