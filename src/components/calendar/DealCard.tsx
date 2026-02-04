import { 
  Hammer, 
  Droplets, 
  Zap, 
  Fan, 
  PaintBucket,
  Wrench,
  AlertTriangle,
  FileText,
  Home,
  ClipboardCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarTask } from '@/pages/Calendar';
import { getCategoryStyles, getCategoryGroup, getCategoryLabel } from '@/lib/calendarCategories';

interface DealCardProps {
  task: CalendarTask;
  compact?: boolean;
  onClick?: () => void;
}

export function DealCard({ task, compact = false, onClick }: DealCardProps) {
  const getCategoryIcon = (category: string) => {
    const iconClass = 'h-3 w-3';
    const group = getCategoryGroup(category);
    
    // Icons based on category group
    switch (group) {
      case 'acquisition_admin':
        return <FileText className={iconClass} />;
      case 'structural_exterior':
        switch (category) {
          case 'demo': return <Hammer className={iconClass} />;
          default: return <Home className={iconClass} />;
        }
      case 'rough_ins':
        switch (category) {
          case 'plumbing_rough': return <Droplets className={iconClass} />;
          case 'electrical_rough': return <Zap className={iconClass} />;
          case 'hvac_rough': return <Fan className={iconClass} />;
          case 'framing': return <Hammer className={iconClass} />;
          default: return <Wrench className={iconClass} />;
        }
      case 'inspections':
        return <ClipboardCheck className={iconClass} />;
      case 'interior_finishes':
        return <PaintBucket className={iconClass} />;
      case 'milestones':
        switch (category) {
          case 'listing_date': return <Calendar className={iconClass} />;
          case 'open_house': return <Home className={iconClass} />;
          case 'stage_clean': return <Sparkles className={iconClass} />;
          default: return <Calendar className={iconClass} />;
        }
      default:
        return <Wrench className={iconClass} />;
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
          'hover:ring-1 hover:ring-emerald-500/50 cursor-grab active:cursor-grabbing',
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
        'hover:ring-2 hover:ring-emerald-500/50 cursor-grab active:cursor-grabbing',
        task.isCriticalPath
          ? 'bg-red-500/10 border-red-500/50'
          : 'bg-slate-800/50 border-slate-700'
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
            <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
            <p className="text-xs text-slate-400 truncate">{task.projectName}</p>
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
        <span className="text-[10px] text-slate-500">
          {task.checklist.filter(c => c.completed).length}/{task.checklist.length} tasks
        </span>
      </div>
    </button>
  );
}