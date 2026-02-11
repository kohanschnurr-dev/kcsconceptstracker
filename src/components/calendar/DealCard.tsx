import { 
  Hammer, Droplets, Zap, Fan, PaintBucket, Wrench, AlertTriangle,
  FileText, Home, ClipboardCheck, Calendar, Sparkles, Layers, Grid2x2,
  DoorOpen, Trees, Landmark, ShieldCheck, Warehouse, Package, Fence, Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarTask } from '@/pages/Calendar';
import { getCategoryStyles, getCategoryGroup, getCategoryLabel } from '@/lib/calendarCategories';

const KEYWORD_ICON_MAP: { keywords: string[]; icon: React.ReactNode }[] = (() => {
  const c = 'h-3 w-3';
  return [
    { keywords: ['floor', 'lvp', 'hardwood', 'carpet'], icon: <Layers className={c} /> },
    { keywords: ['plumb', 'drain', 'pipe', 'water_heater'], icon: <Droplets className={c} /> },
    { keywords: ['electric', 'wiring'], icon: <Zap className={c} /> },
    { keywords: ['hvac', 'ac', 'heat', 'furnace'], icon: <Fan className={c} /> },
    { keywords: ['paint', 'stain'], icon: <PaintBucket className={c} /> },
    { keywords: ['demo', 'demolition'], icon: <Hammer className={c} /> },
    { keywords: ['frame', 'framing', 'carpentry', 'trim'], icon: <Hammer className={c} /> },
    { keywords: ['tile'], icon: <Grid2x2 className={c} /> },
    { keywords: ['cabinet', 'counter'], icon: <Square className={c} /> },
    { keywords: ['window', 'door', 'glass'], icon: <DoorOpen className={c} /> },
    { keywords: ['inspect', 'permit', 'code'], icon: <ClipboardCheck className={c} /> },
    { keywords: ['clean', 'stage'], icon: <Sparkles className={c} /> },
    { keywords: ['fence', 'gate'], icon: <Fence className={c} /> },
    { keywords: ['landscape', 'yard', 'sod'], icon: <Trees className={c} /> },
    { keywords: ['foundation', 'pier', 'concrete'], icon: <Landmark className={c} /> },
    { keywords: ['insulation'], icon: <ShieldCheck className={c} /> },
    { keywords: ['drywall', 'sheetrock'], icon: <PaintBucket className={c} /> },
    { keywords: ['garage'], icon: <Warehouse className={c} /> },
    { keywords: ['roof'], icon: <Home className={c} /> },
    { keywords: ['siding', 'stucco', 'brick', 'exterior'], icon: <Home className={c} /> },
    { keywords: ['list', 'open_house', 'closing', 'sale'], icon: <Calendar className={c} /> },
    { keywords: ['purchase', 'refinanc'], icon: <Calendar className={c} /> },
    { keywords: ['order', 'arrived', 'delivery'], icon: <Package className={c} /> },
  ];
})();

interface DealCardProps {
  task: CalendarTask;
  compact?: boolean;
  onClick?: () => void;
}

export function DealCard({ task, compact = false, onClick }: DealCardProps) {
  const getCategoryIcon = (category: string) => {
    const iconClass = 'h-3 w-3';
    const lower = category.toLowerCase();
    for (const entry of KEYWORD_ICON_MAP) {
      if (entry.keywords.some(kw => lower.includes(kw))) return entry.icon;
    }
    const group = getCategoryGroup(category);
    switch (group) {
      case 'acquisition_admin': return <FileText className={iconClass} />;
      case 'structural_exterior': return <Home className={iconClass} />;
      case 'rough_ins': return <Wrench className={iconClass} />;
      case 'inspections': return <ClipboardCheck className={iconClass} />;
      case 'interior_finishes': return <PaintBucket className={iconClass} />;
      case 'milestones': return <Calendar className={iconClass} />;
      default: return <Wrench className={iconClass} />;
    }
  };

  const getCategoryColor = (category: string) => {
    const styles = getCategoryStyles(category);
    return `${styles.bgClass} ${styles.textClass} ${styles.borderClass}`;
  };

  const getBudgetIndicator = (health: CalendarTask['budgetHealth']) => {
    switch (health) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
    }
  };

  const categoryStyles = getCategoryStyles(task.eventCategory || 'due_diligence');
  const categoryLabel = getCategoryLabel(task.eventCategory || 'due_diligence');

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-2 py-1 rounded text-xs truncate transition-all border',
          'hover:ring-1 hover:ring-primary/50 cursor-grab active:cursor-grabbing',
          task.isCriticalPath 
            ? 'bg-red-500/30 text-red-300 border-red-500/50' 
            : getCategoryColor(task.eventCategory || 'due_diligence')
        )}
      >
        <div className="flex items-center gap-1">
          {task.isCriticalPath && <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />}
          {getCategoryIcon(task.eventCategory || 'due_diligence')}
          <span className="truncate">{task.title}</span>
          <span className={cn('w-2 h-2 rounded-full ml-auto shrink-0', getBudgetIndicator(task.budgetHealth))} />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        'hover:ring-2 hover:ring-primary/50 cursor-grab active:cursor-grabbing',
        task.isCriticalPath
          ? 'bg-red-500/10 border-red-500/50'
          : 'bg-card/50 border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            'p-1.5 rounded border',
            task.isCriticalPath 
              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
              : `${categoryStyles.bgClass} ${categoryStyles.textClass} ${categoryStyles.borderClass}`
          )}>
            {task.isCriticalPath ? <AlertTriangle className="h-3 w-3" /> : getCategoryIcon(task.eventCategory || 'due_diligence')}
          </span>
          <div>
            <h4 className="text-sm font-medium text-foreground truncate">{task.title}</h4>
            <p className="text-xs text-muted-foreground truncate">{task.projectName}</p>
          </div>
        </div>
        <span className={cn('w-3 h-3 rounded-full shrink-0', getBudgetIndicator(task.budgetHealth))} />
      </div>
      
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full border',
          task.isCriticalPath 
            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
            : `${categoryStyles.bgClass} ${categoryStyles.textClass} ${categoryStyles.borderClass}`
        )}>
          {task.isCriticalPath ? 'Critical Path' : categoryLabel}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {task.checklist.filter(c => c.completed).length}/{task.checklist.length} tasks
        </span>
      </div>
    </button>
  );
}
