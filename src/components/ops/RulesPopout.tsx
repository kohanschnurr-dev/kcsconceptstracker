import { useState } from 'react';
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
import { Plus, ChevronDown, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function RulesPopout({ open, onOpenChange, rules, onAddRule, onToggleRule, onDeleteRule }: RulesPopoutProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('order_of_operations');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeRules = rules.filter(r => !r.is_completed);
  const completedRules = rules.filter(r => r.is_completed);

  const activeOrderOfOps = activeRules.filter(r => r.category === 'order_of_operations');
  const activeVendorReqs = activeRules.filter(r => r.category === 'vendor_requirements');

  const handleSubmit = async () => {
    if (!title.trim() || !onAddRule) return;
    setIsSubmitting(true);
    try {
      await onAddRule({ title: title.trim(), category });
      setTitle('');
      setCategory('order_of_operations');
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
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
          <DialogTitle>Operation Rules</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
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
                  <SelectItem value="order_of_operations">Order of Operations</SelectItem>
                  <SelectItem value="vendor_requirements">Vendor Requirements</SelectItem>
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

          {/* Active Order of Operations */}
          {activeOrderOfOps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Order of Operations</h4>
              {activeOrderOfOps.map(rule => renderRuleCard(rule))}
            </div>
          )}

          {/* Active Vendor Requirements */}
          {activeVendorReqs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Vendor Requirements</h4>
              {activeVendorReqs.map(rule => renderRuleCard(rule))}
            </div>
          )}

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
