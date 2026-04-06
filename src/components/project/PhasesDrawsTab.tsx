import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { parseDateString, formatDateString } from '@/lib/dateUtils';
import {
  DollarSign,
  CalendarIcon,
  Plus,
  Trash2,
  GripVertical,
  Landmark,
} from 'lucide-react';

type DrawStatus = 'pending' | 'requested' | 'funded';

interface DrawPhase {
  id: string;
  name: string;
  budgetedAmount: number;
  status: DrawStatus;
  dateFunded?: string;
}

const DEFAULT_PHASES: Omit<DrawPhase, 'id'>[] = [
  { name: 'Site Work & Foundation', budgetedAmount: 0, status: 'pending' },
  { name: 'Framing', budgetedAmount: 0, status: 'pending' },
  { name: 'Dry-In (Roof, Windows, Doors)', budgetedAmount: 0, status: 'pending' },
  { name: 'Rough-Ins (MEP)', budgetedAmount: 0, status: 'pending' },
  { name: 'Insulation & Drywall', budgetedAmount: 0, status: 'pending' },
  { name: 'Interior Finishes', budgetedAmount: 0, status: 'pending' },
  { name: 'Final / Punch & CO', budgetedAmount: 0, status: 'pending' },
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function getStorageKey(projectId: string) {
  return `phases-draws-${projectId}`;
}

const STATUS_CONFIG: Record<DrawStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground border-border' },
  requested: { label: 'Requested', className: 'bg-warning/20 text-warning border-warning/30' },
  funded: { label: 'Funded', className: 'bg-success/20 text-success border-success/30' },
};

interface PhasesDrawsTabProps {
  projectId: string;
  totalLoanAmount: number;
}

export function PhasesDrawsTab({ projectId, totalLoanAmount }: PhasesDrawsTabProps) {
  const [phases, setPhases] = useState<DrawPhase[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(projectId));
    if (stored) {
      try {
        setPhases(JSON.parse(stored));
      } catch {
        setPhases(DEFAULT_PHASES.map(p => ({ ...p, id: generateId() })));
      }
    } else {
      setPhases(DEFAULT_PHASES.map(p => ({ ...p, id: generateId() })));
    }
  }, [projectId]);

  const save = (updated: DrawPhase[]) => {
    setPhases(updated);
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(updated));
  };

  const updatePhase = (id: string, patch: Partial<DrawPhase>) => {
    save(phases.map(p => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addPhase = () => {
    save([...phases, { id: generateId(), name: 'New Phase', budgetedAmount: 0, status: 'pending' }]);
  };

  const removePhase = (id: string) => {
    save(phases.filter(p => p.id !== id));
  };

  const totalBudgeted = phases.reduce((s, p) => s + p.budgetedAmount, 0);
  const totalFunded = phases.filter(p => p.status === 'funded').reduce((s, p) => s + p.budgetedAmount, 0);
  const totalRequested = phases.filter(p => p.status === 'requested').reduce((s, p) => s + p.budgetedAmount, 0);
  const fundedPct = totalBudgeted > 0 ? (totalFunded / totalBudgeted) * 100 : 0;
  const loanRef = totalLoanAmount > 0 ? totalLoanAmount : totalBudgeted;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Draw Schedule Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Budgeted</p>
              <p className="font-mono font-semibold text-lg">{fmt(totalBudgeted)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Funded</p>
              <p className="font-mono font-semibold text-lg text-success">{fmt(totalFunded)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Requested</p>
              <p className="font-mono font-semibold text-lg text-warning">{fmt(totalRequested)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="font-mono font-semibold text-lg">{fmt(loanRef - totalFunded)}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Draw Progress</span>
              <span>{fundedPct.toFixed(0)}%</span>
            </div>
            <Progress value={fundedPct} className="h-2.5" />
          </div>
        </CardContent>
      </Card>

      {/* Phase Rows */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Phases</CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={addPhase}>
            <Plus className="h-3.5 w-3.5" />
            Add Phase
          </Button>
        </CardHeader>
        <CardContent>
          {phases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No phases yet. Add your first phase above.</p>
          ) : (
            <div className="space-y-3">
              {phases.map((phase, index) => (
                <div
                  key={phase.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {/* Grip + Index */}
                  <div className="flex items-center gap-2 shrink-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <span className="text-xs font-mono text-muted-foreground w-5 text-center">{index + 1}</span>
                  </div>

                  {/* Phase Name */}
                  <Input
                    value={phase.name}
                    onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                    className="font-medium sm:flex-1 h-9"
                  />

                  {/* Budgeted Amount */}
                  <div className="relative w-full sm:w-36">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      value={phase.budgetedAmount || ''}
                      onChange={(e) => updatePhase(phase.id, { budgetedAmount: parseFloat(e.target.value) || 0 })}
                      className="pl-7 font-mono h-9"
                      placeholder="0"
                    />
                  </div>

                  {/* Status */}
                  <Select
                    value={phase.status}
                    onValueChange={(v) => {
                      const patch: Partial<DrawPhase> = { status: v as DrawStatus };
                      if (v === 'funded' && !phase.dateFunded) {
                        patch.dateFunded = formatDateString(new Date());
                      }
                      if (v !== 'funded') {
                        patch.dateFunded = undefined;
                      }
                      updatePhase(phase.id, patch);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-32 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['pending', 'requested', 'funded'] as DrawStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          <Badge variant="outline" className={cn('text-xs', STATUS_CONFIG[s].className)}>
                            {STATUS_CONFIG[s].label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date Funded */}
                  {phase.status === 'funded' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn('gap-1.5 text-xs w-full sm:w-auto shrink-0', !phase.dateFunded && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {phase.dateFunded ? format(parseDateString(phase.dateFunded), 'MMM d, yyyy') : 'Set date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={phase.dateFunded ? parseDateString(phase.dateFunded) : undefined}
                          onSelect={(date) => date && updatePhase(phase.id, { dateFunded: formatDateString(date) })}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removePhase(phase.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}