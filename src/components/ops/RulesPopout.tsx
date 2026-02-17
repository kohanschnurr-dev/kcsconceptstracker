import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus, Trash2, Settings, GripVertical, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadRuleGroups, saveRuleGroups, toSnakeCase, type RuleGroup } from '@/lib/ruleGroups';
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

export function RulesPopout({ open, onOpenChange, rules, onAddRule, onDeleteRule, onUpdateRuleCategory }: RulesPopoutProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    if (!title.trim() || !onAddRule) return;
    setIsSubmitting(true);
    try {
      await onAddRule({ title: title.trim(), category, description: description.trim() || undefined });
      setTitle('');
      setDescription('');
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

  const renderRuleCard = (rule: OperationCode) => (
    <div key={rule.id} className="flex gap-3 p-3 rounded-lg border-l-4 border-l-primary bg-card shadow-sm">
      <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{rule.title}</p>
        {rule.description && (
          <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
        )}
      </div>
      {onDeleteRule && (
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80 shrink-0" onClick={() => onDeleteRule(rule.id)}>
          <Trash2 className="h-3 w-3" />
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
                    placeholder="Rule title (e.g., Foundation First)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Why does this rule exist? What lesson was learned?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="min-h-[60px] resize-none"
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

              {/* Rules grouped dynamically */}
              {groups.map(group => {
                const groupRules = rules.filter(r => r.category === group.key);
                if (groupRules.length === 0) return null;
                return (
                  <div key={group.key} className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">{group.label}</h4>
                    {groupRules.map(rule => renderRuleCard(rule))}
                  </div>
                );
              })}

              {rules.length === 0 && !showForm && (
                <p className="text-center text-muted-foreground py-8">No rules yet — add your first operating principle</p>
              )}

              {/* Add New Rule */}
              {onAddRule && !showForm && (
                <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Rule
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
