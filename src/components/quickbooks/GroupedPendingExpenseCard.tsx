import { useState, useMemo } from 'react';
import { formatDisplayDate } from '@/lib/dateUtils';
import { ChevronDown, ChevronUp, Check, Trash2, Receipt, Package, Wrench, StickyNote, Split } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { ALL_CATEGORIES, BUDGET_CATEGORIES } from '@/types';
import type { Project } from '@/types';

// Helper to format category values: "tech_equipment" -> "Tech Equipment"
const formatCategoryValue = (value: string) => {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get appropriate categories based on project type
const getCategoriesForProject = (projectName: string) => {
  if (projectName === 'KCS Concepts') {
    return ALL_CATEGORIES;
  }
  return BUDGET_CATEGORIES;
};

interface PendingExpense {
  id: string;
  qb_id: string;
  vendor_name: string | null;
  amount: number;
  date: string;
  description: string | null;
  receipt_url: string | null;
  category_id: string | null;
  project_id: string | null;
  expense_type?: string | null;
  notes?: string | null;
}

interface GroupedPendingExpenseCardProps {
  expenses: PendingExpense[];
  projects: Project[];
  onCategorize: (expenseId: string, projectId: string, categoryValue: string, expenseType: 'product' | 'labor', notes?: string) => Promise<void>;
  onDelete: (expenseId: string) => Promise<void>;
  onImportAll: (expenseIds: string[], projectId: string) => Promise<void>;
  onOpenSplitModal?: (expense: PendingExpense) => void;
  formatCurrency: (amount: number) => string;
}

export function GroupedPendingExpenseCard({
  expenses,
  projects,
  onCategorize,
  onDelete,
  onImportAll,
  onOpenSplitModal,
  formatCurrency,
}: GroupedPendingExpenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedExpenseType, setSelectedExpenseType] = useState<'product' | 'labor'>('product');
  const [expenseNotes, setExpenseNotes] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  const isSplitGroup = expenses.length > 1;
  const primaryExpense = expenses[0];
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const hasReceipt = expenses.some(e => e.receipt_url);
  
  // Check if all splits already have categories assigned (from SmartSplit)
  const allHaveCategories = useMemo(() => {
    return expenses.every(e => {
      // Extract category from qb_id pattern like purchase_769_split_hardware
      const splitMatch = e.qb_id?.match(/_split_([a-z_]+)$/);
      return splitMatch && splitMatch[1];
    });
  }, [expenses]);

  // Get category labels for each split
  const splitCategories = useMemo(() => {
    return expenses.map(e => {
      const splitMatch = e.qb_id?.match(/_split_([a-z_]+)$/);
      if (splitMatch) {
        return formatCategoryValue(splitMatch[1]);
      }
      return null;
    });
  }, [expenses]);

  const handleImportAll = async () => {
    if (!selectedProject) return;
    setIsImporting(true);
    try {
      await onImportAll(expenses.map(e => e.id), selectedProject);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSingleCategorize = async () => {
    if (!selectedProject || !selectedCategory) return;
    setIsImporting(true);
    try {
      await onCategorize(primaryExpense.id, selectedProject, selectedCategory, selectedExpenseType, expenseNotes);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteAll = async () => {
    for (const expense of expenses) {
      await onDelete(expense.id);
    }
  };

  // Single expense - original behavior
  if (!isSplitGroup) {
    return (
      <div className="p-3 rounded-lg border border-border bg-muted/20">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium">{primaryExpense.vendor_name || 'Unknown Vendor'}</p>
                {hasReceipt && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 gap-1">
                    <Receipt className="h-3 w-3" />
                    Receipt
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <p className="font-mono font-semibold">
                  {formatCurrency(primaryExpense.amount)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(primaryExpense.id)}
                  title="Remove this expense"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{formatDisplayDate(primaryExpense.date)}</span>
              {primaryExpense.description && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[200px]">
                    {primaryExpense.description}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={!selectedProject}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {selectedProject &&
                  getCategoriesForProject(
                    projects.find(p => p.id === selectedProject)?.name || ''
                  ).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 flex-1 min-w-0 sm:max-w-[180px]">
              <StickyNote className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Note (e.g., mailbox)"
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenSplitModal?.(primaryExpense)}
              className="gap-1"
            >
              <Split className="h-4 w-4" />
              <span className="hidden sm:inline">Split</span>
            </Button>
            <ToggleGroup 
              type="single" 
              value={selectedExpenseType}
              onValueChange={(value) => {
                if (value) {
                  setSelectedExpenseType(value as 'product' | 'labor');
                }
              }}
              className="shrink-0"
            >
              <ToggleGroupItem 
                value="product" 
                aria-label="Product"
                className={cn(
                  "gap-1 px-3",
                  selectedExpenseType === 'product' && "bg-blue-500/20 text-blue-400 border-blue-500/50"
                )}
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Product</span>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="labor" 
                aria-label="Labor"
                className={cn(
                  "gap-1 px-3",
                  selectedExpenseType === 'labor' && "bg-orange-500/20 text-orange-400 border-orange-500/50"
                )}
              >
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Labor</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              size="sm"
              disabled={!selectedProject || !selectedCategory || isImporting}
              onClick={handleSingleCategorize}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grouped split expenses
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/20">
      {/* Header Row - Clickable to expand */}
      <div 
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <p className="font-medium">{primaryExpense.vendor_name || 'Unknown Vendor'}</p>
              {hasReceipt && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 gap-1">
                  <Receipt className="h-3 w-3" />
                  Receipt
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <p className="font-mono font-semibold">
                {formatCurrency(totalAmount)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAll();
                }}
                title="Remove all split expenses"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 ml-6">
            <span>{formatDisplayDate(primaryExpense.date)}</span>
            <span>•</span>
            <span>{expenses.length} items split</span>
          </div>
        </div>
      </div>

      {/* Expanded Child Items */}
      {isExpanded && (
        <div className="mt-3 ml-6 space-y-2 border-l-2 border-border pl-3">
          {expenses.map((expense, index) => (
            <div 
              key={expense.id} 
              className="flex items-center justify-between text-sm py-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {index === expenses.length - 1 ? '└──' : '├──'}
                </span>
                <span className="font-medium">
                  {splitCategories[index] || expense.description || 'Item'}
                </span>
              </div>
              <span className="font-mono text-muted-foreground">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Import Controls */}
      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border/50">
        {allHaveCategories ? (
          <>
            <p className="text-xs text-muted-foreground">
              Categories already assigned via SmartSplit
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!selectedProject || isImporting}
                onClick={handleImportAll}
                className="gap-2"
              >
                {isImporting ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Import All
              </Button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Expand to see split items. Use SmartSplit to categorize.
          </p>
        )}
      </div>
    </div>
  );
}
