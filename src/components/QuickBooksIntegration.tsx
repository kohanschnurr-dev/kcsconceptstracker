import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { RefreshCw, Link2, Link2Off, ChevronDown, ChevronUp, Check, Trash2, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useQuickBooks } from '@/hooks/useQuickBooks';
import { ALL_CATEGORIES } from '@/types';
import type { Project } from '@/types';

// Helper to format category values: "tech_equipment" -> "Tech Equipment"
const formatCategoryValue = (value: string) => {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface QuickBooksIntegrationProps {
  projects: Project[];
  onExpenseImported?: () => void;
}

export function QuickBooksIntegration({ projects, onExpenseImported }: QuickBooksIntegrationProps) {
  const {
    isConnected,
    isDemoMode,
    isLoading,
    isSyncing,
    pendingExpenses,
    connect,
    disconnect,
    syncExpenses,
    categorizeExpense,
    deleteExpense,
    enableDemoMode,
  } = useQuickBooks();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateDisplay = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCategorize = async (expenseId: string) => {
    const projectId = selectedProject[expenseId];
    const categoryId = selectedCategory[expenseId];

    if (!projectId || !categoryId) return;

    const success = await categorizeExpense(expenseId, projectId, categoryId);
    if (success && onExpenseImported) {
      onExpenseImported();
    }
  };

  const getProjectCategories = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.categories || [];
  };

  const handleSync = () => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    syncExpenses(startStr, endStr);
  };

  const handleDelete = async (expenseId: string) => {
    await deleteExpense(expenseId);
  };

  if (isLoading) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Checking QuickBooks connection...</span>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="glass-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">QuickBooks Integration</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                    {isDemoMode ? "Demo Mode" : isConnected ? "Connected" : "Not Connected"}
                  </Badge>
                  {pendingExpenses.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                      {pendingExpenses.length} pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border p-4 space-y-4">
            {!isConnected ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Connect your QuickBooks account to automatically import expenses
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={connect} className="gap-2">
                    <Link2 className="h-4 w-4" />
                    Connect QuickBooks
                  </Button>
                  <Button variant="outline" onClick={enableDemoMode} className="gap-2">
                    Try Demo Mode
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Date Range Picker Section */}
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-sm font-medium">Sync Range:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Expenses'}
                  </Button>
                </div>

                {pendingExpenses.length === 0 ? (
                  <div className="text-center py-6">
                    <Check className="h-12 w-12 mx-auto text-success mb-3" />
                    <p className="text-muted-foreground">
                      All expenses have been categorized!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Categorize these expenses to import them into your projects, or delete ones you don't need:
                    </p>
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {pendingExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="p-3 rounded-lg border border-border bg-muted/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{expense.vendor_name || 'Unknown Vendor'}</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono font-semibold">
                                    {formatCurrency(expense.amount)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(expense.id)}
                                    title="Remove this expense"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{formatDateDisplay(expense.date)}</span>
                                {expense.description && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-[200px]">
                                      {expense.description}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <Select
                              value={selectedProject[expense.id] || ''}
                              onValueChange={(value) =>
                                setSelectedProject((prev) => ({ ...prev, [expense.id]: value }))
                              }
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
                              value={selectedCategory[expense.id] || ''}
                              onValueChange={(value) =>
                                setSelectedCategory((prev) => ({ ...prev, [expense.id]: value }))
                              }
                              disabled={!selectedProject[expense.id]}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select Category" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedProject[expense.id] &&
                                  getProjectCategories(selectedProject[expense.id]).map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {ALL_CATEGORIES.find((b) => b.value === cat.category)?.label ||
                                        formatCategoryValue(cat.category)}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              disabled={
                                !selectedProject[expense.id] || !selectedCategory[expense.id]
                              }
                              onClick={() => handleCategorize(expense.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnect}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                  >
                    <Link2Off className="h-4 w-4" />
                    {isDemoMode ? 'Exit Demo Mode' : 'Disconnect QuickBooks'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}