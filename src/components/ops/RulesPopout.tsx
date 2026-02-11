import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

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
}

export function RulesPopout({ open, onOpenChange, rules, onAddRule }: RulesPopoutProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('order_of_operations');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const orderOfOps = rules.filter(r => r.category === 'order_of_operations');
  const vendorReqs = rules.filter(r => r.category === 'vendor_requirements');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Operation Rules</DialogTitle>
            {onAddRule && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px]">
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
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!title.trim() || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Adding...' : 'Add Rule'}
                </Button>
              </div>
            )}

            {/* Order of Operations */}
            {orderOfOps.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Order of Operations</h4>
                <div className="space-y-2">
                  {orderOfOps.map((rule) => (
                    <div 
                      key={rule.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/20"
                    >
                      <Checkbox 
                        checked={rule.is_completed || false} 
                        disabled
                        className="pointer-events-none"
                      />
                      <span className={`text-sm ${rule.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                        {rule.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor Requirements */}
            {vendorReqs.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Vendor Requirements</h4>
                <div className="space-y-2">
                  {vendorReqs.map((rule) => (
                    <div 
                      key={rule.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/20"
                    >
                      <Checkbox 
                        checked={rule.is_completed || false} 
                        disabled
                        className="pointer-events-none"
                      />
                      <span className={`text-sm ${rule.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                        {rule.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rules.length === 0 && !showForm && (
              <p className="text-center text-muted-foreground py-8">No rules configured</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
