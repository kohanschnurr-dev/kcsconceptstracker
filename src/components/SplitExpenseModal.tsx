import { useState, useEffect } from 'react';
import { Plus, Trash2, Split, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Package, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_CATEGORIES, BUDGET_CATEGORIES } from '@/types';
import type { Project } from '@/types';

interface SplitLine {
  id: string;
  amount: string;
  projectId: string;
  categoryValue: string;
  expenseType: 'product' | 'labor';
  notes: string;
}

interface SplitExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: {
    id: string;
    vendor_name: string | null;
    amount: number;
    date: string;
    description: string | null;
  } | null;
  projects: Project[];
  onSplit: (expenseId: string, splits: Array<{
    amount: number;
    projectId: string;
    categoryValue: string;
    expenseType: 'product' | 'labor';
    notes: string;
  }>) => Promise<boolean>;
}

export function SplitExpenseModal({
  open,
  onOpenChange,
  expense,
  projects,
  onSplit,
}: SplitExpenseModalProps) {
  const [splits, setSplits] = useState<SplitLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with two split lines when modal opens
  useEffect(() => {
    if (open && expense) {
      const halfAmount = (expense.amount / 2).toFixed(2);
      setSplits([
        { id: '1', amount: halfAmount, projectId: '', categoryValue: '', expenseType: 'product', notes: '' },
        { id: '2', amount: halfAmount, projectId: '', categoryValue: '', expenseType: 'product', notes: '' },
      ]);
    }
  }, [open, expense]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getCategoriesForProject = (projectName: string) => {
    if (projectName === 'KCS Concepts') {
      return ALL_CATEGORIES;
    }
    return BUDGET_CATEGORIES;
  };

  const totalSplit = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const remaining = expense ? expense.amount - totalSplit : 0;
  const isBalanced = Math.abs(remaining) < 0.01;

  const addSplitLine = () => {
    const newId = String(Date.now());
    setSplits([...splits, { 
      id: newId, 
      amount: remaining > 0 ? remaining.toFixed(2) : '0.00', 
      projectId: '', 
      categoryValue: '', 
      expenseType: 'product',
      notes: '' 
    }]);
  };

  const removeSplitLine = (id: string) => {
    if (splits.length > 2) {
      setSplits(splits.filter(s => s.id !== id));
    }
  };

  const updateSplit = (id: string, field: keyof SplitLine, value: string) => {
    setSplits(splits.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const allSplitsValid = splits.every(s => 
    parseFloat(s.amount) > 0 && s.projectId && s.categoryValue
  );

  const handleSubmit = async () => {
    if (!expense || !isBalanced || !allSplitsValid) return;
    
    setIsSubmitting(true);
    try {
      const splitData = splits.map(s => ({
        amount: parseFloat(s.amount),
        projectId: s.projectId,
        categoryValue: s.categoryValue,
        expenseType: s.expenseType,
        notes: s.notes,
      }));
      
      const success = await onSplit(expense.id, splitData);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Expense
          </DialogTitle>
        </DialogHeader>

        {/* Original Expense Info */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{expense.vendor_name || 'Unknown Vendor'}</p>
              <p className="text-sm text-muted-foreground">{expense.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(expense.date).toLocaleDateString()}
              </p>
            </div>
            <p className="font-mono font-bold text-lg">{formatCurrency(expense.amount)}</p>
          </div>
        </div>

        {/* Split Lines */}
        <div className="space-y-3">
          <Label>Split into:</Label>
          {splits.map((split, index) => {
            const project = projects.find(p => p.id === split.projectId);
            const categories = project ? getCategoriesForProject(project.name) : [];
            
            return (
              <div key={split.id} className="p-3 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Split #{index + 1}</span>
                  {splits.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSplitLine(split.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={split.amount}
                        onChange={(e) => updateSplit(split.id, 'amount', e.target.value)}
                        className="pl-7"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Note</Label>
                    <Input
                      placeholder="e.g., mailbox"
                      value={split.notes}
                      onChange={(e) => updateSplit(split.id, 'notes', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Project</Label>
                    <Select
                      value={split.projectId}
                      onValueChange={(value) => {
                        updateSplit(split.id, 'projectId', value);
                        updateSplit(split.id, 'categoryValue', ''); // Reset category when project changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={split.categoryValue}
                      onValueChange={(value) => updateSplit(split.id, 'categoryValue', value)}
                      disabled={!split.projectId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs">Type:</Label>
                  <ToggleGroup
                    type="single"
                    value={split.expenseType}
                    onValueChange={(value) => {
                      if (value) updateSplit(split.id, 'expenseType', value);
                    }}
                    className="shrink-0"
                  >
                    <ToggleGroupItem
                      value="product"
                      aria-label="Product"
                      size="sm"
                      className={cn(
                        "gap-1 px-2 h-7",
                        split.expenseType === 'product' && "bg-blue-500/20 text-blue-400 border-blue-500/50"
                      )}
                    >
                      <Package className="h-3 w-3" />
                      <span className="text-xs">Product</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="labor"
                      aria-label="Labor"
                      size="sm"
                      className={cn(
                        "gap-1 px-2 h-7",
                        split.expenseType === 'labor' && "bg-orange-500/20 text-orange-400 border-orange-500/50"
                      )}
                    >
                      <Wrench className="h-3 w-3" />
                      <span className="text-xs">Labor</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={addSplitLine}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another Split
          </Button>
        </div>

        {/* Balance Summary */}
        <div className={cn(
          "p-3 rounded-lg flex items-center justify-between",
          isBalanced 
            ? "bg-green-500/10 border border-green-500/30" 
            : "bg-warning/10 border border-warning/30"
        )}>
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-warning" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isBalanced ? "text-green-500" : "text-warning"
            )}>
              {isBalanced ? 'Balanced!' : `Remaining: ${formatCurrency(remaining)}`}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {formatCurrency(totalSplit)} / {formatCurrency(expense.amount)}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isBalanced || !allSplitsValid || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? 'Splitting...' : 'Confirm Split'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
