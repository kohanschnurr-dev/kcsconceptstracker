import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus, Trash2, Settings, GripVertical, Shield, X,
  AlertTriangle, Info, OctagonX, Eye, EyeOff, ShieldAlert,
  ShieldCheck, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  loadRuleGroups, saveRuleGroups, toSnakeCase,
  SEVERITY_CONFIG, STATUS_CONFIG,
  type RuleGroup, type SeverityLevel, type RuleStatus,
} from '@/lib/ruleGroups';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OperationCode {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_completed: boolean | null;
}

interface RulesPopoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: OperationCode[];
  onAddRule?: (rule: { title: string; category: string; description?: string }) => Promise<void>;
  onDeleteRule?: (ruleId: string) => Promise<void>;
  onUpdateRuleCategory?: (ruleId: string, newCategory: string) => Promise<void>;
}

// Local severity/status storage per rule
function loadRuleMeta(): Record<string, { severity: SeverityLevel; status: RuleStatus }> {
  try {
    const stored = localStorage.getItem('rule-meta');
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveRuleMeta(meta: Record<string, { severity: SeverityLevel; status: RuleStatus }>) {
  localStorage.setItem('rule-meta', JSON.stringify(meta));
}

function SortableGroupRow({ group, canDelete, onDelete }: { group: RuleGroup; canDelete: boolean; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
      <button {...attributes} {...listeners} className="cursor-grab text-slate-500 hover:text-slate-300 touch-none">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm flex-1 text-slate-200">{group.label}</span>
      {canDelete && (
        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400/60 hover:text-red-400 hover:bg-red-500/15" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

const SEVERITY_ICONS: Record<SeverityLevel, typeof Info> = {
  information: Info,
  warning: AlertTriangle,
  hard_stop: OctagonX,
};

export function RulesPopout({ open, onOpenChange, rules, onAddRule, onDeleteRule, onUpdateRuleCategory }: RulesPopoutProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('information');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [groups, setGroups] = useState<RuleGroup[]>(loadRuleGroups);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [ruleMeta, setRuleMeta] = useState<Record<string, { severity: SeverityLevel; status: RuleStatus }>>(loadRuleMeta);

  // Reload groups from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      setGroups(loadRuleGroups());
      setRuleMeta(loadRuleMeta());
    }
  }, [open]);

  // Set default category to first group
  useEffect(() => {
    if (groups.length > 0 && !category) {
      setCategory(groups[0].key);
    }
  }, [groups, category]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Compliance summary
  const complianceSummary = useMemo(() => {
    const total = rules.length;
    const triggered = rules.filter(r => ruleMeta[r.id]?.status === 'triggered').length;
    const active = rules.filter(r => (ruleMeta[r.id]?.status || 'active') === 'active').length;
    const paused = rules.filter(r => ruleMeta[r.id]?.status === 'paused').length;
    const complianceRate = total > 0 ? Math.round(((total - triggered) / total) * 100) : 100;
    return { total, triggered, active, paused, complianceRate };
  }, [rules, ruleMeta]);

  const getRuleSeverity = (ruleId: string): SeverityLevel => ruleMeta[ruleId]?.severity || 'information';
  const getRuleStatus = (ruleId: string): RuleStatus => ruleMeta[ruleId]?.status || 'active';

  const updateRuleMeta = (ruleId: string, updates: Partial<{ severity: SeverityLevel; status: RuleStatus }>) => {
    const current = ruleMeta[ruleId] || { severity: 'information' as SeverityLevel, status: 'active' as RuleStatus };
    const updated = { ...ruleMeta, [ruleId]: { ...current, ...updates } };
    setRuleMeta(updated);
    saveRuleMeta(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !onAddRule) return;
    setIsSubmitting(true);
    try {
      await onAddRule({ title: title.trim(), category, description: description.trim() || undefined });
      // After adding, we'll set the severity via meta on the next render cycle
      setTitle('');
      setDescription('');
      setSeverity('information');
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddGroup = () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    const key = toSnakeCase(label);
    if (groups.some(g => g.key === key)) return;
    const updated = [...groups, { key, label }];
    setGroups(updated);
    saveRuleGroups(updated);
    setNewGroupLabel('');
  };

  const handleDeleteGroup = async (groupKey: string) => {
    if (groups.length <= 1) return;
    const fallbackGroup = groups.find(g => g.key !== groupKey)!;
    if (onUpdateRuleCategory) {
      const affectedRules = rules.filter(r => r.category === groupKey);
      for (const rule of affectedRules) {
        await onUpdateRuleCategory(rule.id, fallbackGroup.key);
      }
    }
    const updated = groups.filter(g => g.key !== groupKey);
    setGroups(updated);
    saveRuleGroups(updated);
    if (category === groupKey) setCategory(fallbackGroup.key);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groups.findIndex(g => g.key === active.id);
    const newIndex = groups.findIndex(g => g.key === over.id);
    const reordered = arrayMove(groups, oldIndex, newIndex);
    setGroups(reordered);
    saveRuleGroups(reordered);
  };

  const cycleSeverity = (ruleId: string) => {
    const current = getRuleSeverity(ruleId);
    const order: SeverityLevel[] = ['information', 'warning', 'hard_stop'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateRuleMeta(ruleId, { severity: next });
  };

  const cycleStatus = (ruleId: string) => {
    const current = getRuleStatus(ruleId);
    const order: RuleStatus[] = ['active', 'paused', 'triggered'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateRuleMeta(ruleId, { status: next });
  };

  const renderRuleCard = (rule: OperationCode) => {
    const sev = getRuleSeverity(rule.id);
    const status = getRuleStatus(rule.id);
    const sevConfig = SEVERITY_CONFIG[sev];
    const statusConfig = STATUS_CONFIG[status];
    const SevIcon = SEVERITY_ICONS[sev];

    return (
      <div
        key={rule.id}
        className={cn(
          "p-4 rounded-xl border transition-all duration-300",
          sevConfig.cssClass,
          status === 'triggered' && "rule-status-triggered border-red-500/40",
          status === 'paused' && "opacity-60",
          status !== 'triggered' && "border-slate-700/40"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Severity Icon */}
          <button
            onClick={() => cycleSeverity(rule.id)}
            className={cn("p-1.5 rounded-lg mt-0.5 transition-colors cursor-pointer", sevConfig.bgColor)}
            title={`Severity: ${sevConfig.label} (click to change)`}
          >
            <SevIcon className={cn("h-4 w-4", sevConfig.color)} />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm font-jakarta text-slate-100">{rule.title}</p>
              {/* Status Badge */}
              <button
                onClick={() => cycleStatus(rule.id)}
                className="flex items-center gap-1.5 cursor-pointer"
                title={`Status: ${statusConfig.label} (click to change)`}
              >
                <span className={cn(
                  "h-2 w-2 rounded-full inline-block",
                  statusConfig.dotColor,
                  status === 'active' && "rule-status-active"
                )} />
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  {statusConfig.label}
                </span>
              </button>
            </div>

            {rule.description && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rule.description}</p>
            )}

            {/* Severity label */}
            <div className="flex items-center gap-2 mt-2">
              <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full", sevConfig.bgColor, sevConfig.color)}>
                {sevConfig.label}
              </span>
              {status === 'triggered' && (
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Guardrail Triggered
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={() => cycleStatus(rule.id)}
              title={status === 'paused' ? 'Resume' : 'Pause'}
            >
              {status === 'paused' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            {onDeleteRule && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-500/15"
                onClick={() => onDeleteRule(rule.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overlay-dashboard flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div className="overlay-dashboard-panel-rounded w-full max-w-lg max-h-[85vh] flex flex-col font-jakarta animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Operation Rules</h2>
              <p className="text-xs text-slate-400">Active Guardrails & Compliance</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-lg", manageMode ? "text-amber-400 bg-amber-500/15" : "text-slate-400 hover:text-white hover:bg-slate-700/50")}
              onClick={() => setManageMode(!manageMode)}
              title="Manage Groups"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Compliance Summary Banner */}
        {!manageMode && rules.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/40 border border-slate-700/40">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className={cn(
                  "text-2xl font-semibold font-jakarta",
                  complianceSummary.complianceRate === 100 ? "text-emerald-400" : complianceSummary.complianceRate >= 80 ? "text-amber-400" : "text-red-400"
                )}>
                  {complianceSummary.complianceRate}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Compliance</p>
              </div>
              <div>
                <p className="text-2xl font-semibold font-jakarta text-emerald-400">{complianceSummary.active}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Active</p>
              </div>
              <div>
                <p className="text-2xl font-semibold font-jakarta text-red-400">{complianceSummary.triggered}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Triggered</p>
              </div>
              <div>
                <p className="text-2xl font-semibold font-jakarta text-slate-500">{complianceSummary.paused}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Paused</p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
          {manageMode ? (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rule Groups</h4>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={groups.map(g => g.key)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {groups.map(group => (
                      <SortableGroupRow
                        key={group.key}
                        group={group}
                        canDelete={groups.length > 1}
                        onDelete={() => handleDeleteGroup(group.key)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="flex gap-2">
                <Input
                  placeholder="New group name"
                  value={newGroupLabel}
                  onChange={e => setNewGroupLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                  className="flex-1 bg-slate-800/80 border-slate-600"
                />
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                  onClick={handleAddGroup}
                  disabled={!newGroupLabel.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Add Rule Form */}
              {showForm && (
                <div className="space-y-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <Input
                    placeholder="Rule title (e.g., Foundation First)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="bg-slate-800/80 border-slate-600 font-jakarta"
                  />
                  <Textarea
                    placeholder="Why does this rule exist? What lesson was learned?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="min-h-[60px] resize-none bg-slate-800/80 border-slate-600"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Group</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-slate-800/80 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(g => (
                            <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Severity</label>
                      <Select value={severity} onValueChange={(v) => setSeverity(v as SeverityLevel)}>
                        <SelectTrigger className="bg-slate-800/80 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="information">Information</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="hard_stop">Hard Stop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-jakarta font-semibold"
                      disabled={!title.trim() || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Rule'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Rules grouped dynamically */}
              {groups.map(group => {
                const groupRules = rules.filter(r => r.category === group.key);
                if (groupRules.length === 0) return null;
                return (
                  <div key={group.key} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-400" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{group.label}</h4>
                      <span className="text-[10px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded-full">
                        {groupRules.length}
                      </span>
                    </div>
                    {groupRules.map(rule => renderRuleCard(rule))}
                  </div>
                );
              })}

              {rules.length === 0 && !showForm && (
                <div className="text-center py-12">
                  <div className="p-3 rounded-2xl bg-slate-800/50 w-fit mx-auto mb-3">
                    <ShieldCheck className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm">No rules yet</p>
                  <p className="text-slate-500 text-xs mt-1">Add your first operating principle</p>
                </div>
              )}

              {/* Add New Rule */}
              {onAddRule && !showForm && (
                <Button
                  variant="outline"
                  className="w-full border-dashed border-slate-600 text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-amber-500/5 font-jakarta"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Rule
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
