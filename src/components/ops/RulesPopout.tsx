import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, ChevronDown, RotateCcw, Trash2, Settings, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadRuleGroups, saveRuleGroups, toSnakeCase, type RuleGroup } from '@/lib/ruleGroups';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OperationCode {
  id: string;
  title: string;
  category: string | null;
  is_completed: boolean | null;
}

interface RulesPopoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: OperationCode[];
  onAddRule?: (rule: { title: string; category: string }) => Promise<void>;
  onToggleRule?: (ruleId: string, completed: boolean) => Promise<void>;
  onDeleteRule?: (ruleId: string) => Promise<void>;
  onUpdateRuleCategory?: (ruleId: string, newCategory: string) => Promise<void>;
}

function SortableGroupRow({ group, canDelete, onDelete }: { group: RuleGroup; canDelete: boolean; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground touch-none">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm flex-1">{group.label}</span>
      {canDelete && (
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function RulesPopout({ open, onOpenChange, rules, onAddRule, onToggleRule, onDeleteRule, onUpdateRuleCategory }: RulesPopoutProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [groups, setGroups] = useState<RuleGroup[]>(loadRuleGroups);
  const [newGroupLabel, setNewGroupLabel] = useState('');

  // Reload groups from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      setGroups(loadRuleGroups());
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

  const activeRules = rules.filter(r => !r.is_completed);
  const completedRules = rules.filter(r => r.is_completed);

  const handleSubmit = async () => {
    if (!title.trim() || !onAddRule) return;
    setIsSubmitting(true);
    try {
      await onAddRule({ title: title.trim(), category });
      setTitle('');
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
    // Reassign rules in deleted group
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

  const renderRuleCard = (rule: OperationCode, isCompleted = false) => (
    <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
      <Checkbox
        checked={rule.is_completed || false}
        onCheckedChange={(checked) => onToggleRule?.(rule.id, !!checked)}
        disabled={!onToggleRule}
      />
      <span className={cn("text-sm flex-1", rule.is_completed && "line-through text-muted-foreground")}>
        {rule.title}
      </span>
      {!isCompleted && onDeleteRule && (
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80" onClick={() => onDeleteRule(rule.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
      {isCompleted && onToggleRule && (
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => onToggleRule(rule.id, false)} title="Reopen rule">
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Operation Rules</DialogTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setManageMode(!manageMode)} title="Manage Groups">
              <Settings className={cn("h-4 w-4", manageMode && "text-primary")} />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {manageMode ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Rule Groups</h4>
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
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddGroup} disabled={!newGroupLabel.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {showForm && (
                <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <Input
                    placeholder="Rule title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!title.trim() || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Rule'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Active rules grouped dynamically */}
              {groups.map(group => {
                const groupRules = activeRules.filter(r => r.category === group.key);
                if (groupRules.length === 0) return null;
                return (
                  <div key={group.key} className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">{group.label}</h4>
                    {groupRules.map(rule => renderRuleCard(rule))}
                  </div>
                );
              })}

              {activeRules.length === 0 && !showForm && (
                <p className="text-center text-muted-foreground py-8">No active rules</p>
              )}

              {/* Add New Rule */}
              {onAddRule && !showForm && (
                <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Rule
                </Button>
              )}

              {/* Completed Rules History */}
              {completedRules.length > 0 && (
                <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                      <ChevronDown className={cn("h-4 w-4 transition-transform", historyOpen && "rotate-180")} />
                      View Completed ({completedRules.length})
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-3">
                    {completedRules.map(rule => renderRuleCard(rule, true))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
