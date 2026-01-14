import { 
  Hammer, 
  Pipette, 
  Zap, 
  Landmark, 
  Fan, 
  Square, 
  PaintBucket,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarTask } from '@/pages/Calendar';

interface DealCardProps {
  task: CalendarTask;
  compact?: boolean;
  onClick?: () => void;
}

export function DealCard({ task, compact = false, onClick }: DealCardProps) {
  const getTradeIcon = (trade: CalendarTask['trade']) => {
    const iconClass = 'h-3 w-3';
    switch (trade) {
      case 'demo': return <Hammer className={iconClass} />;
      case 'plumbing': return <Pipette className={iconClass} />;
      case 'electrical': return <Zap className={iconClass} />;
      case 'structural': return <Landmark className={iconClass} />;
      case 'hvac': return <Fan className={iconClass} />;
      case 'drywall': return <Square className={iconClass} />;
      case 'finish': return <PaintBucket className={iconClass} />;
      default: return <Wrench className={iconClass} />;
    }
  };

  const getStatusColor = (status: CalendarTask['status']) => {
    switch (status) {
      case 'permitting': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'demo': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'rough-in': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'finish': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'complete': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getBudgetIndicator = (health: CalendarTask['budgetHealth']) => {
    switch (health) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
    }
  };

  const getStatusLabel = (status: CalendarTask['status']) => {
    switch (status) {
      case 'permitting': return 'Permitting';
      case 'demo': return 'Demo';
      case 'rough-in': return 'Rough-in';
      case 'finish': return 'Finish';
      case 'complete': return 'Complete';
      default: return status;
    }
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-2 py-1 rounded text-xs truncate transition-all',
          'hover:ring-1 hover:ring-emerald-500/50 cursor-pointer',
          getStatusColor(task.status)
        )}
      >
        <div className="flex items-center gap-1">
          {getTradeIcon(task.trade)}
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
        'hover:ring-2 hover:ring-emerald-500/50 cursor-pointer',
        'bg-slate-800/50 border-slate-700'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('p-1.5 rounded', getStatusColor(task.status))}>
            {getTradeIcon(task.trade)}
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
          getStatusColor(task.status)
        )}>
          {getStatusLabel(task.status)}
        </span>
        <span className="text-[10px] text-slate-500">
          {task.checklist.filter(c => c.completed).length}/{task.checklist.length} tasks
        </span>
      </div>
    </button>
  );
}
