import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { parseDateString, formatDisplayDate } from '@/lib/dateUtils';
import { arrayMove, useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronDown,
  Settings,
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  Camera,
  X,
  MoreVertical
} from 'lucide-react';

function SortableTabItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted">
      <GripVertical {...attributes} {...listeners} className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
import { MainLayout } from '@/components/layout/MainLayout';
import { Home, FileText, HardHat, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { getBudgetCategories } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PhotoGallery } from '@/components/project/PhotoGallery';
import { DocumentsGallery } from '@/components/project/DocumentsGallery';

import { ProfitCalculator } from '@/components/project/ProfitCalculator';
import { CashFlowCalculator } from '@/components/project/CashFlowCalculator';
import { ProjectLoanTab } from '@/components/project/ProjectLoanTab';

import { ProjectCalendar } from '@/components/project/ProjectCalendar';
import { ProjectTasks } from '@/components/project/ProjectTasks';

import { ProjectVendors } from '@/components/project/ProjectVendors';
import { ProjectInfo } from '@/components/project/ProjectInfo';

import { PendingBudgetBanner } from '@/components/project/PendingBudgetBanner';
import { PendingBudgetDialog } from '@/components/project/PendingBudgetDialog';
import { MonthlyExpenses } from '@/components/project/MonthlyExpenses';
import { ProcurementTab } from '@/components/project/ProcurementTab';
import { ProjectReport } from '@/components/project/ProjectReport';
import { LeaseTab } from '@/components/project/LeaseTab';

import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { Input } from '@/components/ui/input';
import { MessageOwnerButton } from '@/components/project/MessageOwnerButton';
interface DBProject {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'complete' | 'on_hold';
  project_type: 'fix_flip' | 'rental' | 'new_construction';
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
  completed_date?: string | null;
  hm_loan_amount?: number | null;
  hm_interest_rate?: number | null;
  hm_loan_term_months?: number | null;
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

const CORE_TABS = ['schedule', 'tasks', 'financials', 'documents', 'team', 'info', 'photos', 'logs', 'procurement'];

const DEFAULT_DETAIL_TAB_ORDER_BY_TYPE: Record<string, string[]> = {
  fix_flip: [...CORE_TABS, 'loan'],
  new_construction: [...CORE_TABS, 'loan'],
  rental: [...CORE_TABS, 'loan', 'lease', 'cashflow'],
};

const DEFAULT_DETAIL_TAB_ORDER = DEFAULT_DETAIL_TAB_ORDER_BY_TYPE['fix_flip'];

const TAB_LABELS: Record<string, string> = {
  schedule: 'Schedule',
  tasks: 'Tasks',
  documents: 'Documents',
  photos: 'Photos',
  logs: 'Logs',
  financials: 'Financials',
  cashflow: 'Cash Flow',
  loan: 'Loan',
  team: 'Team',
  info: 'Info',
  procurement: 'Procurement',
  lease: 'Lease',
  
};

function getTabLabel(tab: string): string {
  return TAB_LABELS[tab] ?? tab;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, updateDetailTabOrder, getDetailTabOrder } = useProfile();
  
  const [project, setProject] = useState<DBProject | null>(null);
  const [categories, setCategories] = useState<(DBCategory & { actualSpent: number })[]>([]);
  const [expenses, setExpenses] = useState<DBExpense[]>([]);
  const [allExpensesForExport, setAllExpensesForExport] = useState<DBExpense[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DBDailyLog[]>([]);
  const [constructionSpent, setConstructionSpent] = useState(0);
  const [transactionCostActual, setTransactionCostActual] = useState(0);
  const [holdingCostActual, setHoldingCostActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [procurementCount, setProcurementCount] = useState(0);
  const [activeTab, setActiveTab] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertTarget, setConvertTarget] = useState<string>('fix_flip');
  const [nameValue, setNameValue] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [quickLogWork, setQuickLogWork] = useState('');
  const [quickLogIssues, setQuickLogIssues] = useState('');
  const [quickLogDate, setQuickLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickLogSubmitting, setQuickLogSubmitting] = useState(false);
  const [quickLogShowIssues, setQuickLogShowIssues] = useState(false);
  const [quickLogPhotoUrls, setQuickLogPhotoUrls] = useState<string[]>([]);
  const [quickLogUploading, setQuickLogUploading] = useState(false);
  const quickLogFileRef = useRef<HTMLInputElement>(null);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [editLog, setEditLog] = useState<DBDailyLog | null>(null);
  const [editWork, setEditWork] = useState('');
  const [editIssues, setEditIssues] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { toast } = useToast();

  const handleQuickLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogWork.trim() || !id) return;
    setQuickLogSubmitting(true);
    try {
      const { error } = await supabase.from('daily_logs').insert({
        project_id: id,
        date: quickLogDate,
        work_performed: quickLogWork.trim(),
        issues: quickLogIssues.trim() || null,
        photo_urls: quickLogPhotoUrls.length > 0 ? quickLogPhotoUrls : [],
      });
      if (error) throw error;
      setQuickLogWork('');
      setQuickLogIssues('');
      setQuickLogShowIssues(false);
      setQuickLogPhotoUrls([]);
      setQuickLogDate(new Date().toISOString().split('T')[0]);
      toast({ title: 'Log added', description: 'Daily log entry saved.' });
      fetchProjectData(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save log.', variant: 'destructive' });
    } finally {
      setQuickLogSubmitting(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!deleteLogId) return;
    const { error } = await supabase.from('daily_logs').delete().eq('id', deleteLogId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete log.', variant: 'destructive' });
    } else {
      toast({ title: 'Log deleted' });
      setDailyLogs((prev) => prev.filter((l) => l.id !== deleteLogId));
    }
    setDeleteLogId(null);
  };

  const handleSaveEdit = async () => {
    if (!editLog) return;
    setIsSavingEdit(true);
    const { error } = await supabase
      .from('daily_logs')
      .update({ work_performed: editWork.trim() || null, issues: editIssues.trim() || null })
      .eq('id', editLog.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
    } else {
      toast({ title: 'Log updated' });
      setDailyLogs((prev) =>
        prev.map((l) =>
          l.id === editLog.id ? { ...l, work_performed: editWork.trim() || null, issues: editIssues.trim() || null } : l
        )
      );
      setEditLog(null);
    }
    setIsSavingEdit(false);
  };



  const saveField = async (field: 'name' | 'address', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast({ title: `${field === 'name' ? 'Name' : 'Address'} cannot be empty`, variant: 'destructive' });
      return;
    }
    if (project && trimmed === project[field]) return;
    const { error } = await supabase.from('projects').update({ [field]: trimmed }).eq('id', id!);
    if (error) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    } else {
      setProject(prev => prev ? { ...prev, [field]: trimmed } : prev);
    }
  };

  const handleEditBlur = (field: 'name' | 'address') => {
    saveField(field, field === 'name' ? nameValue : addressValue);
    setTimeout(() => {
      if (!nameInputRef.current?.matches(':focus') && !addressInputRef.current?.matches(':focus')) {
        setIsEditing(false);
      }
    }, 0);
  };

  const startEditing = () => {
    if (project) {
      setNameValue(project.name);
      setAddressValue(project.address);
      setIsEditing(true);
    }
  };

  const fetchProjectData = async (showLoading = true) => {
    if (!id) return;
    
    if (showLoading) setLoading(true);
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (projectError) {
      console.error('Error fetching project:', projectError);
      if (showLoading) setLoading(false);
      return;
    }
    
    if (!projectData) {
      if (showLoading) setLoading(false);
      return;
    }
    
    setProject(projectData as DBProject);
    
    const [categoriesRes, expensesRes, qbExpensesRes, logsRes, procurementRes] = await Promise.all([
      supabase.from('project_categories').select('*').eq('project_id', id),
      supabase.from('expenses').select('*').eq('project_id', id).order('date', { ascending: false }),
      supabase.from('quickbooks_expenses').select('*').eq('project_id', id).eq('is_imported', true).order('date', { ascending: false }),
      supabase.from('daily_logs').select('*').eq('project_id', id).order('date', { ascending: false }),
      supabase.from('project_procurement_items').select('id', { count: 'exact', head: true }).eq('project_id', id)
    ]);
    
    setProcurementCount(procurementRes.count || 0);
    
    const categoriesData = categoriesRes.data || [];
    const expensesData = expensesRes.data || [];
    const qbExpensesData = qbExpensesRes.data || [];
    
    // Collect QB IDs already imported as regular expenses to prevent duplicates
    const importedQbIds = new Set(
      expensesData.filter(e => e.qb_expense_id).map(e => e.qb_expense_id)
    );
    const dedupedQbExpenses = qbExpensesData.filter(qb => !importedQbIds.has(qb.id));

    const allExpensesByCategoryId: Record<string, number> = {};
    expensesData.forEach(e => {
      allExpensesByCategoryId[e.category_id] = (allExpensesByCategoryId[e.category_id] || 0) + Number(e.amount);
    });
    dedupedQbExpenses.forEach(e => {
      if (e.category_id) {
        allExpensesByCategoryId[e.category_id] = (allExpensesByCategoryId[e.category_id] || 0) + Number(e.amount);
      }
    });
    
    const categoriesWithSpent = categoriesData.map(cat => {
      const actualSpent = allExpensesByCategoryId[cat.id] || 0;
      return { ...cat, actualSpent };
    });
    
    const qbExpensesConverted: DBExpense[] = dedupedQbExpenses
      .filter(qb => qb.category_id)
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
    
    // Sum only construction expenses for profit calculator (avoids double-counting loan/holding costs)
    const constructionOnlySpent = expensesData
      .filter(e => !e.cost_type || e.cost_type === 'construction')
      .reduce((sum, e) => sum + Number(e.amount), 0)
      + dedupedQbExpenses
        .filter(e => e.category_id && (!e.cost_type || e.cost_type === 'construction'))
        .reduce((sum, e) => sum + Number(e.amount), 0);

    // Sum transaction and holding (monthly) expenses for "Actual" mode in profit calculator
    const txActual = expensesData
      .filter(e => e.cost_type === 'transaction')
      .reduce((sum, e) => sum + Number(e.amount), 0)
      + dedupedQbExpenses
        .filter(e => e.cost_type === 'transaction')
        .reduce((sum, e) => sum + Number(e.amount), 0);
    const holdActual = expensesData
      .filter(e => e.cost_type === 'monthly')
      .reduce((sum, e) => sum + Number(e.amount), 0)
      + dedupedQbExpenses
        .filter(e => e.cost_type === 'monthly')
        .reduce((sum, e) => sum + Number(e.amount), 0);

    setCategories(categoriesWithSpent);
    setExpenses(expensesData);
    setConstructionSpent(constructionOnlySpent);
    setTransactionCostActual(txActual);
    setHoldingCostActual(holdActual);
    setAllExpensesForExport(combinedExpenses);
    setDailyLogs(logsRes.data || []);
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Calculate total budget - prefer project-level total_budget when set, fall back to category sum
  const categoryTotal = categories.reduce((sum, cat) => sum + Number(cat.estimated_budget), 0);
  const totalBudget = (project?.total_budget ?? 0) > 0 ? project!.total_budget : categoryTotal;
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

  const [completionDateOpen, setCompletionDateOpen] = useState(false);

  const handleStatusChange = async (newStatus: 'active' | 'complete' | 'on_hold') => {
    if (!project || newStatus === project.status) return;
    
    if (newStatus === 'complete') {
      setCompletionDateOpen(true);
      return;
    }

    setUpdatingStatus(true);
    
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus, completed_date: null } as any)
      .eq('id', project.id);
    
    if (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project status',
        variant: 'destructive',
      });
    } else {
      setProject({ ...project, status: newStatus, completed_date: null });
      toast({
        title: 'Status updated',
        description: `Project marked as ${newStatus.replace('_', ' ')}`,
      });
    }
    
    setUpdatingStatus(false);
  };

  const handleCompleteWithDate = async (date: Date) => {
    if (!project) return;
    setCompletionDateOpen(false);
    setUpdatingStatus(true);
    const completedDate = format(date, 'yyyy-MM-dd');
    
    const { error } = await supabase
      .from('projects')
      .update({ status: 'complete', completed_date: completedDate } as any)
      .eq('id', project.id);
    
    if (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project status',
        variant: 'destructive',
      });
    } else {
      setProject({ ...project, status: 'complete', completed_date: completedDate });
      toast({
        title: 'Project completed',
        description: `Marked complete on ${format(date, 'MMM d, yyyy')}`,
      });
    }
    
    setUpdatingStatus(false);
  };

  const handleConvertProjectType = async (newType?: string) => {
    if (!project) return;
    const targetType = newType || (isRental ? 'fix_flip' : 'rental');
    
    const { error } = await supabase
      .from('projects')
      .update({ project_type: targetType as any })
      .eq('id', project.id);
    
    const typeLabels: Record<string, string> = {
      fix_flip: 'Fix & Flip',
      new_construction: 'New Construction',
      rental: 'Rental',
    };
    
    if (error) {
      console.error('Error converting project type:', error);
      toast({
        title: 'Error',
        description: `Failed to convert project to ${typeLabels[targetType] || targetType}`,
        variant: 'destructive',
      });
    } else {
      setProject({ ...project, project_type: targetType as any });
      toast({
        title: `Converted to ${typeLabels[targetType]}`,
        description: targetType === 'rental'
          ? 'Head to the Financials tab to set up your rental income details.'
          : `The project is now a ${typeLabels[targetType]}.`,
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!project || !id) return;
    setDeleting(true);
    try {
      // Reset QB expenses back to pending queue
      await supabase
        .from('quickbooks_expenses')
        .update({ project_id: null, category_id: null, is_imported: false, cost_type: 'construction' })
        .eq('project_id', id);

      // Delete project (cascades to all child tables)
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'Project deleted', description: `${project.name} has been permanently removed.` });
      navigate('/projects');
    } catch (err: any) {
      toast({ title: 'Failed to delete project', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteStep(0);
      setDeleteConfirmName('');
    }
  };

  const isRental = project?.project_type === 'rental';
  const isNewConstruction = project?.project_type === 'new_construction';

  const defaultPreset = useMemo(() => {
    try {
      const defaultName = localStorage.getItem('profit-calculator-default-preset') || 'Standard';
      const raw = localStorage.getItem('profit-calculator-presets');
      if (raw) {
        const presets = JSON.parse(raw) as Array<{ name: string; closingPct: number; holdingPct: number; closingFlat: number; holdingFlat: number }>;
        if (Array.isArray(presets)) return presets.find(p => p.name === defaultName) ?? presets[0] ?? null;
      }
    } catch { /* ignore */ }
    return null;
  }, [project?.id]);

  const effectiveTabOrder = useMemo(() => {
    if (!project) return DEFAULT_DETAIL_TAB_ORDER;
    const typeDefault = DEFAULT_DETAIL_TAB_ORDER_BY_TYPE[project.project_type] || DEFAULT_DETAIL_TAB_ORDER;
    const order = getDetailTabOrder(project.project_type, typeDefault);
    // Only show tabs that belong to this project type
    return order.filter(tab => typeDefault.includes(tab));
  }, [project?.project_type, profile?.detail_tab_order]);

  const moveDetailTab = (index: number, direction: 'up' | 'down') => {
    if (!project) return;
    const typeDefault = DEFAULT_DETAIL_TAB_ORDER_BY_TYPE[project.project_type] || DEFAULT_DETAIL_TAB_ORDER;
    const fullOrder = getDetailTabOrder(project.project_type, typeDefault);
    const newOrder = arrayMove(fullOrder, index, direction === 'up' ? index - 1 : index + 1);
    updateDetailTabOrder.mutate({ projectType: project.project_type, tabOrder: newOrder });
  };

  const tabSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleTabDragEnd = (event: DragEndEvent) => {
    if (!project) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = effectiveTabOrder.indexOf(active.id as string);
    const newIndex = effectiveTabOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const typeDefault = DEFAULT_DETAIL_TAB_ORDER_BY_TYPE[project.project_type] || DEFAULT_DETAIL_TAB_ORDER;
    const fullOrder = getDetailTabOrder(project.project_type, typeDefault);
    const newOrder = arrayMove(fullOrder, oldIndex, newIndex);
    updateDetailTabOrder.mutate({ projectType: project.project_type, tabOrder: newOrder });
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
        {/* Pending Budget Dialog - auto-opens on page load */}
        {(project as any).pending_budget && (
          <PendingBudgetDialog
            projectId={project.id}
            pendingBudget={(project as any).pending_budget}
            existingCategories={categories}
            currentTotalBudget={totalBudget}
            onResolved={() => fetchProjectData(false)}
          />
        )}
        <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Convert to {convertTarget === 'fix_flip' ? 'Fix & Flip' : convertTarget === 'new_construction' ? 'New Construction' : 'Rental Property'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will convert <strong>{project.name}</strong> to a {convertTarget === 'fix_flip' ? 'Fix & Flip' : convertTarget === 'new_construction' ? 'New Construction' : 'Rental'} project. All existing data will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleConvertProjectType(convertTarget)}>
                Convert
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Project - Step 1 */}
        <AlertDialog open={deleteStep === 1} onOpenChange={(open) => { if (!open) setDeleteStep(0); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{project.name}</strong>? All project data (expenses, tasks, documents, photos, logs) will be permanently removed. Any categorized QuickBooks expenses will be sent back to the queue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => { e.preventDefault(); setDeleteStep(2); }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Project - Step 2: Type to confirm */}
        <AlertDialog open={deleteStep === 2} onOpenChange={(open) => { if (!open) { setDeleteStep(0); setDeleteConfirmName(''); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>This action cannot be undone</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>Type <strong>{project.name}</strong> to confirm deletion.</p>
                  <Input
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Type project name..."
                    autoFocus
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmName('')}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteConfirmName !== project.name || deleting}
                onClick={(e) => { e.preventDefault(); handleDeleteProject(); }}
              >
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Deleting...</> : 'Permanently Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <Input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="text-2xl font-semibold h-auto py-0 px-1 w-64"
                    onBlur={() => handleEditBlur('name')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { saveField('name', nameValue); addressInputRef.current?.focus(); }
                      if (e.key === 'Escape') { setNameValue(project.name); setAddressValue(project.address); setIsEditing(false); }
                    }}
                  />
                ) : (
                  <h1 className="text-2xl font-semibold">
                    {project.name}
                  </h1>
                )}
                <Badge
                  className={cn(
                    'gap-1',
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
                </Badge>
                {!isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Project actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={startEditing}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setReportOpen(true)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Clock className="h-4 w-4 mr-2" />
                          Project Status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
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
                          <DropdownMenuSeparator />
                          {(['fix_flip', 'new_construction', 'rental'] as const)
                            .filter(t => t !== project.project_type)
                            .map(t => (
                              <DropdownMenuItem key={t} onClick={() => { setConvertTarget(t); setShowConvertDialog(true); }}>
                                {t === 'fix_flip' ? <Hammer className="h-4 w-4 mr-2" /> : t === 'new_construction' ? <HardHat className="h-4 w-4 mr-2" /> : <Home className="h-4 w-4 mr-2" />}
                                Convert to {t === 'fix_flip' ? 'Fix & Flip' : t === 'new_construction' ? 'New Construction' : 'Rental'}
                              </DropdownMenuItem>
                            ))
                          }
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteStep(1)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              <Dialog open={completionDateOpen} onOpenChange={setCompletionDateOpen}>
                <DialogContent className="w-auto max-w-fit p-6">
                  <DialogHeader>
                    <DialogTitle>Select Completion Date</DialogTitle>
                  </DialogHeader>
                  <CalendarComponent
                    mode="single"
                    selected={new Date()}
                    onSelect={(date) => date && handleCompleteWithDate(date)}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </DialogContent>
              </Dialog>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      ref={addressInputRef}
                      value={addressValue}
                      onChange={(e) => setAddressValue(e.target.value)}
                      className="text-sm h-auto py-0 px-1 w-64"
                      onBlur={() => handleEditBlur('address')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { saveField('address', addressValue); setIsEditing(false); }
                        if (e.key === 'Escape') { setNameValue(project.name); setAddressValue(project.address); setIsEditing(false); }
                      }}
                    />
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {project.address}
                  </span>
                )}
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
                {project.completed_date && (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Completed {formatDate(project.completed_date)}
                  </span>
                )}
              </div>
            </div>
            {/* Right side: PM-only actions */}
            <div className="flex items-start shrink-0">
              <MessageOwnerButton />
            </div>
          </div>
        </div>

        {/* Summary Cards - Clickable - Navigate to Budget Page */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card 
            className="glass-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-primary/50"
            onClick={() => navigate(`/projects/${id}/budget`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Budget</span>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(totalBudget)}</p>
            </CardContent>
          </Card>

          <Card 
            className="glass-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-warning/50"
            onClick={() => navigate(`/projects/${id}/budget`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">Total Spent</span>
              </div>
              <p className="text-2xl font-bold font-mono text-warning">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>

          <Card 
            className="glass-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-success/50"
            onClick={() => navigate(`/projects/${id}/budget`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {remaining >= 0 ? (
                  <TrendingDown className="h-4 w-4 text-success" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm text-muted-foreground">Remaining</span>
              </div>
              <p className={cn(
                "text-2xl font-bold font-mono",
                remaining >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(remaining)}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="glass-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-muted-foreground/50"
            onClick={() => setActiveTab('procurement')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Procurement</span>
              </div>
              <p className="text-2xl font-bold font-mono">{procurementCount}</p>
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
                  className="progress-fill bg-primary"
                  style={{ width: `${Math.min(percentSpent, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Costs */}
        <MonthlyExpenses projectId={id!} formatCurrency={formatCurrency} />

        {/* Tabs for detailed views - Schedule first (most used for active projects) */}
        <Tabs value={activeTab || effectiveTabOrder[0]} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="overflow-x-auto scrollbar-none flex-1 min-w-0">
              <TabsList className="flex h-10 w-max justify-start gap-0 min-w-full bg-transparent p-0 border-b border-border rounded-none">
                {effectiveTabOrder.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground bg-transparent"
                  >
                    {getTabLabel(tab)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="hidden sm:block shrink-0">
              <Popover open={reorderOpen} onOpenChange={setReorderOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <p className="text-xs text-muted-foreground mb-2 px-2">Tab Order</p>
                  <DndContext sensors={tabSensors} collisionDetection={closestCenter} onDragEnd={handleTabDragEnd}>
                    <SortableContext items={effectiveTabOrder} strategy={verticalListSortingStrategy}>
                      {effectiveTabOrder.map((tab) => (
                        <SortableTabItem key={tab} id={tab} label={getTabLabel(tab)} />
                      ))}
                    </SortableContext>
                  </DndContext>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchStartY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              const dy = e.changedTouches[0].clientY - touchStartY.current;
              if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
              const order = effectiveTabOrder;
              const currentIndex = order.indexOf(activeTab || order[0]);
              if (dx < 0) {
                setActiveTab(order[Math.min(currentIndex + 1, order.length - 1)]);
              } else {
                setActiveTab(order[Math.max(currentIndex - 1, 0)]);
              }
            }}
          >
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
              <>
                <ProfitCalculator 
                  projectId={id!}
                  projectType={project.project_type as any}
                  totalBudget={totalBudget}
                  totalSpent={constructionSpent}
                  initialPurchasePrice={project.purchase_price || 0}
                  initialArv={project.arv || 0}
                  initialClosingPct={(project as any).closing_costs_pct ?? defaultPreset?.closingPct ?? 6}
                  initialHoldingPct={(project as any).holding_costs_pct ?? defaultPreset?.holdingPct ?? 3}
                  initialClosingMode={(project as any).closing_costs_mode ?? 'pct'}
                  initialHoldingMode={(project as any).holding_costs_mode ?? 'pct'}
                  initialClosingFlat={(project as any).closing_costs_flat ?? defaultPreset?.closingFlat ?? 0}
                  initialHoldingFlat={(project as any).holding_costs_flat ?? defaultPreset?.holdingFlat ?? 0}
                  transactionCostActual={transactionCostActual}
                  holdingCostActual={holdingCostActual}
                  onSaved={() => fetchProjectData(false)}
                />
              </>
          </TabsContent>

          {isRental && (
            <TabsContent value="cashflow" className="space-y-6">
              <CashFlowCalculator 
                projectId={id!}
                propertyAddress={project.address || project.name}
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
                initialVacancyRate={project.vacancy_rate ?? 8}
                initialMonthlyMaintenance={project.monthly_maintenance ?? 0}
                initialManagementRate={project.management_rate ?? 10}
                initialRehabOverride={(project as any).cashflow_rehab_override ?? null}
                initialRehabMode={(project as any).cashflow_rehab_mode || undefined}
                initialTaxPeriod={(project as any).cashflow_tax_period || undefined}
                initialInsurancePeriod={(project as any).cashflow_insurance_period || undefined}
                initialHoaPeriod={(project as any).cashflow_hoa_period || undefined}
                initialMaintenancePeriod={(project as any).cashflow_maintenance_period || undefined}
                hmLoanAmount={project.hm_loan_amount || 0}
                hmInterestRate={project.hm_interest_rate || 0}
                hmLoanTermMonths={project.hm_loan_term_months || 0}
                onSaved={() => fetchProjectData(false)}
              />
            </TabsContent>
          )}

          <TabsContent value="loan" className="space-y-6">
              <ProjectLoanTab
                projectId={id!}
                purchasePrice={project.purchase_price || 0}
                totalBudget={totalBudget}
                arv={project.arv || 0}
                projectStartDate={project.start_date}
                project={project}
                onSaved={() => fetchProjectData(false)}
              />
            </TabsContent>

          <TabsContent value="team">
            <ProjectVendors projectId={id!} />
          </TabsContent>

          <TabsContent value="info">
            <ProjectInfo projectId={id!} projectType={project.project_type} />
          </TabsContent>

          <TabsContent value="photos">
            <PhotoGallery projectId={id!} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsGallery projectId={id!} projectType={project.project_type} projectName={project.name} projectAddress={project.address} />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            {/* Quick Add Log */}
            <Card className="glass-card">
              <CardContent className="pt-5 pb-4">
                <form onSubmit={handleQuickLogSubmit} className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Quick Add Log</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Textarea
                      placeholder="Work performed today..."
                      value={quickLogWork}
                      onChange={(e) => setQuickLogWork(e.target.value)}
                      rows={1}
                      className="flex-1 min-h-[36px] resize-none"
                      disabled={quickLogSubmitting}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={quickLogSubmitting}
                          className="shrink-0 gap-1.5 text-xs px-2 sm:px-3"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{format(parseDateString(quickLogDate), 'MMM d, yyyy')}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent
                          mode="single"
                          selected={parseDateString(quickLogDate)}
                          onSelect={(date) => {
                            if (date) {
                              const y = date.getFullYear();
                              const m = String(date.getMonth() + 1).padStart(2, '0');
                              const d = String(date.getDate()).padStart(2, '0');
                              setQuickLogDate(`${y}-${m}-${d}`);
                            }
                          }}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Hidden file input */}
                    <input
                      ref={quickLogFileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        setQuickLogUploading(true);
                        try {
                          for (const file of Array.from(files)) {
                            const fileExt = file.name.split('.').pop() || 'jpg';
                            const fileName = `daily-logs/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                            const { error: uploadError } = await supabase.storage.from('project-photos').upload(fileName, file);
                            if (uploadError) { console.error('Upload error:', uploadError); continue; }
                            const { data } = supabase.storage.from('project-photos').getPublicUrl(fileName);
                            setQuickLogPhotoUrls(prev => [...prev, data.publicUrl]);
                          }
                        } finally {
                          setQuickLogUploading(false);
                          if (quickLogFileRef.current) quickLogFileRef.current.value = '';
                        }
                      }}
                    />

                    {/* Camera button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "shrink-0 gap-1 min-w-[36px] px-2",
                        quickLogPhotoUrls.length > 0 && "text-primary"
                      )}
                      disabled={quickLogUploading}
                      onClick={() => quickLogFileRef.current?.click()}
                    >
                      {quickLogUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                      {quickLogPhotoUrls.length > 0 && <span className="text-xs">{quickLogPhotoUrls.length}</span>}
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={!quickLogWork.trim() || quickLogSubmitting}
                      className="shrink-0 px-2 sm:px-3"
                    >
                      {quickLogSubmitting ? (
                        <span className="hidden sm:inline">Saving...</span>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 sm:hidden" />
                          <span className="hidden sm:inline">Add Log</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Thumbnail preview strip */}
                  {quickLogPhotoUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {quickLogPhotoUrls.map((url, index) => (
                        <div key={index} className="relative group w-10 h-10 rounded-lg overflow-hidden border bg-muted">
                          <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setQuickLogPhotoUrls(prev => prev.filter(u => u !== url))}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Collapsible open={quickLogShowIssues} onOpenChange={setQuickLogShowIssues}>
                    <CollapsibleTrigger asChild>
                      <button type="button" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        <AlertTriangle className="h-3 w-3" />
                        {quickLogShowIssues ? 'Hide issues' : 'Add issues?'}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <Textarea
                        placeholder="Any problems or concerns?"
                        value={quickLogIssues}
                        onChange={(e) => setQuickLogIssues(e.target.value)}
                        rows={1}
                        className="resize-none min-h-[36px]"
                        disabled={quickLogSubmitting}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </form>
              </CardContent>
            </Card>

            {/* Existing Logs */}
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
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            <span className="font-medium">{formatDate(log.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditLog(log);
                                setEditWork(log.work_performed || '');
                                setEditIssues(log.issues || '');
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteLogId(log.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteLogId} onOpenChange={(open) => { if (!open) setDeleteLogId(null); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Daily Log?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The log entry will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDeleteLog}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Edit Log Dialog */}
            <Dialog open={!!editLog} onOpenChange={(open) => { if (!open) setEditLog(null); }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Edit Log — {editLog ? formatDate(editLog.date) : ''}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Performed</label>
                    <Textarea
                      value={editWork}
                      onChange={(e) => setEditWork(e.target.value)}
                      placeholder="Describe the work completed..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Issues Encountered <span className="text-muted-foreground font-normal">(optional)</span></label>
                    <Textarea
                      value={editIssues}
                      onChange={(e) => setEditIssues(e.target.value)}
                      placeholder="Any problems or concerns?"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditLog(null)}>Cancel</Button>
                  <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="procurement">
            <ProcurementTab projectId={id!} categories={categories} />
          </TabsContent>


          <TabsContent value="lease">
            <LeaseTab projectId={id!} />
          </TabsContent>

          </div>
        </Tabs>
      </div>
      {project && (
        <ProjectReport
          project={project}
          categories={categories}
          expenses={allExpensesForExport}
          open={reportOpen}
          onOpenChange={setReportOpen}
          constructionSpent={constructionSpent}
          transactionCostActual={transactionCostActual}
          holdingCostActual={holdingCostActual}
        />
      )}
    </MainLayout>
  );
}
