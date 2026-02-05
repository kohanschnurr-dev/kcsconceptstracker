import { useState, useEffect } from 'react';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OperationCode {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_completed: boolean;
  is_pinned: boolean;
  category: string;
}

const DEFAULT_CODES = [
  { title: 'Foundation First', order_index: 0 },
  { title: 'Cast Iron Scoping Mandatory', order_index: 1 },
  { title: 'Pre-Sheetrock HVAC Inspection', order_index: 2 },
  { title: 'Electrical Before Drywall', order_index: 3 },
  { title: 'Structural Sign-off Required', order_index: 4 },
  { title: 'Permit Verification', order_index: 5 },
];

export function OperationCodesPanel() {
  const [codes, setCodes] = useState<OperationCode[]>([]);
  const [newRule, setNewRule] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('operation_codes')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Seed default codes if empty
      if (!data || data.length === 0) {
        await seedDefaultCodes(user.id);
        return;
      }

      setCodes(data);
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const seedDefaultCodes = async (userId: string) => {
    try {
      const codesToInsert = DEFAULT_CODES.map(code => ({
        user_id: userId,
        title: code.title,
        order_index: code.order_index,
        is_completed: false,
        is_pinned: true,
        category: 'general',
      }));

      const { data, error } = await supabase
        .from('operation_codes')
        .insert(codesToInsert)
        .select();

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error seeding codes:', error);
    }
  };

  const toggleComplete = async (code: OperationCode) => {
    try {
      const { error } = await supabase
        .from('operation_codes')
        .update({ is_completed: !code.is_completed })
        .eq('id', code.id);

      if (error) throw error;

      setCodes(prev => prev.map(c => 
        c.id === code.id ? { ...c, is_completed: !c.is_completed } : c
      ));
    } catch (error) {
      console.error('Error updating code:', error);
    }
  };

  const addRule = async () => {
    if (!newRule.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const maxOrder = codes.length > 0 ? Math.max(...codes.map(c => c.order_index)) + 1 : 0;

      const { data, error } = await supabase
        .from('operation_codes')
        .insert({
          user_id: user.id,
          title: newRule.trim(),
          order_index: maxOrder,
          is_completed: false,
          is_pinned: true,
          category: 'general',
        })
        .select()
        .single();

      if (error) throw error;

      setCodes(prev => [...prev, data]);
      setNewRule('');
      
      toast({
        title: 'Rule added',
        description: 'New operation code added successfully',
      });
    } catch (error) {
      console.error('Error adding rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add rule',
        variant: 'destructive',
      });
    }
  };

  const deleteCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('operation_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCodes(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting code:', error);
    }
  };

  const completedCount = codes.filter(c => c.is_completed).length;
  const totalCount = codes.length;

  return (
    <div className="ops-panel p-4">
      <div className="ops-header flex items-center justify-between">
        <span>ORDER OF OPERATIONS</span>
        <span className="text-xs font-mono text-primary">
          {completedCount}/{totalCount}
        </span>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4">Loading...</div>
      ) : (
        <div className="space-y-2">
          {codes.map((code) => (
            <div
              key={code.id}
              className={`group flex items-center gap-2 py-1.5 px-2 rounded-sm transition-colors ${
                code.is_completed ? 'bg-success/10' : 'hover:bg-muted/30'
              }`}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 cursor-grab" />
              <Checkbox
                checked={code.is_completed}
                onCheckedChange={() => toggleComplete(code)}
                className="ops-checkbox"
              />
              <span className={`flex-1 text-sm ${
                code.is_completed ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}>
                {code.title}
              </span>
              <button
                onClick={() => deleteCode(code.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new rule */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
        <Input
          placeholder="Add new rule..."
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addRule()}
          className="h-8 text-sm bg-transparent border-border/30"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={addRule}
          disabled={!newRule.trim()}
          className="h-8 px-2"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
