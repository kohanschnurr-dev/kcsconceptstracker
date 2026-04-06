import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { RefreshCw, Link2, Link2Off, ChevronDown, ChevronUp, Check, CalendarIcon, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useQuickBooks } from '@/hooks/useQuickBooks';
import type { Project } from '@/types';
import { SplitExpenseModal } from './SplitExpenseModal';
import { SmartSplitReceiptUpload } from './SmartSplitReceiptUpload';
import { GroupedPendingExpenseCard } from './quickbooks/GroupedPendingExpenseCard';

interface QuickBooksIntegrationProps {
  projects: Project[];
  onExpenseImported?: () => void;
}

export function QuickBooksIntegration({ projects, onExpenseImported }: QuickBooksIntegrationProps) {
  const navigate = useNavigate();
  const {
    isConnected,
    isDemoMode,
    isLoading,
    isSyncing,
    pendingExpenses,
    hiddenExpenses,
    showHidden,
    setShowHidden,
    connect,
    disconnect,
    syncExpenses,
    categorizeExpense,
    splitExpense,
    deleteExpense,
    hideExpense,
    unhideExpense,
    fetchPendingExpenses,
    enableDemoMode,
    importAllSplits,
  } = useQuickBooks();

  const [isExpanded, setIsExpanded] = useState(false);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [pendingAreaHeight, setPendingAreaHeight] = useState(400);
  const [expenseToSplit, setExpenseToSplit] = useState<{
    id: string;
    vendor_name: string | null;
    amount: number;
    date: string;
    description: string | null;
  } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Group pending expenses by parent QB transaction ID
  const groupedPendingExpenses = useMemo(() => {
    const groups = new Map<string, typeof pendingExpenses>();
    
    pendingExpenses.forEach((expense) => {
      let parentId = expense.qb_id;
      
      // Extract parent ID from split pattern
      const splitMatch = expense.qb_id?.match(/^(.+?)_split_/);
      if (splitMatch) {
        parentId = splitMatch[1];
      }
      
      if (!groups.has(parentId)) {
        groups.set(parentId, []);
      }
      groups.get(parentId)!.push(expense);
    });
    
    return Array.from(groups.values()).sort((a, b) => 
      new Date(b[0].date).getTime() - new Date(a[0].date).getTime()
    );
  }, [pendingExpenses]);

  const handleCategorize = async (expenseId: string, projectId: string, categoryValue: string, expenseType: 'product' | 'labor', notes?: string, costType?: string) => {
    if (!projectId || !categoryValue) return;

    const success = await categorizeExpense(expenseId, projectId, categoryValue, expenseType, notes, costType);
    if (success && onExpenseImported) {
      onExpenseImported();
    }
  };

  const handleImportAll = async (expenseIds: string[], projectId: string) => {
    const success = await importAllSplits(expenseIds, projectId);
    if (success && onExpenseImported) {
      onExpenseImported();
    }
  };


  const handleSync = () => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    syncExpenses(startStr, endStr);
  };

  const handleDelete = async (expenseId: string) => {
    await deleteExpense(expenseId);
  };

  const handleOpenSplitModal = (expense: typeof pendingExpenses[0]) => {
    setExpenseToSplit({
      id: expense.id,
      vendor_name: expense.vendor_name,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
    });
    setSplitModalOpen(true);
  };

  const handleSplit = async (
    expenseId: string,
    splits: Array<{
      amount: number;
      projectId: string;
      categoryValue: string;
      expenseType: 'product' | 'labor';
      notes: string;
    }>
  ) => {
    const success = await splitExpense(expenseId, splits);
    if (success && onExpenseImported) {
      onExpenseImported();
    }
    return success;
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
    <div className="space-y-4">
      {/* SmartSplit Receipt Upload */}
      <SmartSplitReceiptUpload 
        projects={projects}
        pendingQBExpenses={pendingExpenses}
        onReceiptProcessed={onExpenseImported} 
        onRefreshQBExpenses={fetchPendingExpenses}
      />
      
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
                  <Button onClick={() => navigate('/settings')} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Connect in Settings
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

                {groupedPendingExpenses.length === 0 ? (
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
                    <div 
                      className="overflow-y-auto space-y-3"
                      style={{ maxHeight: `${pendingAreaHeight}px` }}
                    >
                      {groupedPendingExpenses.map((expenseGroup) => (
                        <GroupedPendingExpenseCard
                          key={expenseGroup[0].id}
                          expenses={expenseGroup}
                          projects={projects}
                          onCategorize={handleCategorize}
                          onDelete={handleDelete}
                          onHide={async (id) => { await hideExpense(id); }}
                          onImportAll={handleImportAll}
                          onOpenSplitModal={handleOpenSplitModal}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                    
                    {/* Resize Handle */}
                    <div
                      className="h-4 flex items-center justify-center cursor-ns-resize hover:bg-muted/30 transition-colors group select-none"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const startY = e.clientY;
                        const startHeight = pendingAreaHeight;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const delta = moveEvent.clientY - startY;
                          const newHeight = Math.max(150, Math.min(800, startHeight + delta));
                          setPendingAreaHeight(newHeight);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      onTouchStart={(e) => {
                        const startY = e.touches[0].clientY;
                        const startHeight = pendingAreaHeight;
                        
                        const handleTouchMove = (moveEvent: TouchEvent) => {
                          const delta = moveEvent.touches[0].clientY - startY;
                          const newHeight = Math.max(150, Math.min(800, startHeight + delta));
                          setPendingAreaHeight(newHeight);
                        };
                        
                        const handleTouchEnd = () => {
                          document.removeEventListener('touchmove', handleTouchMove);
                          document.removeEventListener('touchend', handleTouchEnd);
                        };
                        
                        document.addEventListener('touchmove', handleTouchMove);
                        document.addEventListener('touchend', handleTouchEnd);
                      }}
                    >
                      <div className="w-12 h-1 rounded-full bg-border group-hover:bg-muted-foreground/50 transition-colors" />
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

      <SplitExpenseModal
        open={splitModalOpen}
        onOpenChange={setSplitModalOpen}
        expense={expenseToSplit}
        projects={projects}
        onSplit={handleSplit}
      />
    </Collapsible>
    </div>
  );
}