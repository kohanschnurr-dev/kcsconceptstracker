import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getBudgetCategories } from '@/types';
import { CategoryPreset, DEFAULT_CATEGORY_PRESETS, PRESETS_STORAGE_KEY } from '@/lib/budgetPresets';

export default function BudgetPresetsSection() {
  const { user } = useAuth();
  const [presets, setPresets] = useState<CategoryPreset[]>(DEFAULT_CATEGORY_PRESETS);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const dbLoadedRef = useRef(false);

  useEffect(() => {
    if (!user || dbLoadedRef.current) return;

    const loadPresets = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('budget_presets')
          .eq('user_id', user.id)
          .maybeSingle();

        const dbPresets = data?.budget_presets as unknown as CategoryPreset[] | null;

        if (dbPresets && Array.isArray(dbPresets) && dbPresets.length > 0) {
          const normalized = dbPresets.map((p: any) => ({ ...p, mode: p.mode || 'psf' }));
          setPresets(normalized);
        } else {
          const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setPresets(parsed.map((p: any) => ({ ...p, mode: p.mode || 'psf' })));
              }
            } catch {}
          }
        }
      } catch {}
      dbLoadedRef.current = true;
    };

    loadPresets();
  }, [user]);

  const savePresets = async (updated: CategoryPreset[]) => {
    setPresets(updated);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ budget_presets: updated as any } as any)
          .eq('user_id', user.id);
      } catch {}
    }
  };

  const updateRate = (index: number, value: number) => {
    const updated = presets.map((p, i) => (i === index ? { ...p, pricePerSqft: value } : p));
    savePresets(updated);
  };

  const updateMode = (index: number, mode: 'psf' | 'flat') => {
    const updated = presets.map((p, i) => (i === index ? { ...p, mode } : p));
    savePresets(updated);
  };

  const removePreset = (index: number) => {
    const updated = presets.filter((_, i) => i !== index);
    savePresets(updated);
    toast.success('Category removed');
  };

  const addPreset = () => {
    if (!newCategoryValue) return;
    if (presets.some(p => p.category === newCategoryValue)) {
      toast.error('Category already in presets');
      return;
    }
    const catInfo = getBudgetCategories().find(c => c.value === newCategoryValue);
    if (!catInfo) return;

    const updated = [...presets, { category: newCategoryValue, label: catInfo.label, pricePerSqft: 5.0, mode: 'psf' as const }];
    savePresets(updated);
    setNewCategoryValue('');
    toast.success(`Added "${catInfo.label}"`);
  };

  const handleReset = () => {
    savePresets([...DEFAULT_CATEGORY_PRESETS]);
    toast.success('Reset to defaults');
  };

  const availableCategories = getBudgetCategories()
    .filter(cat => !presets.some(p => p.category === cat.value))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-3 px-1">
      <p className="text-xs text-muted-foreground">
        Categories with $/sqft or flat-rate presets used in the Budget Calculator. When you enter square footage, these auto-calculate.
      </p>

      <div className="space-y-2">
        {presets.map((preset, index) => (
          <div key={preset.category} className="flex items-center gap-2 rounded-md border border-border/50 p-2">
            <span className="text-sm flex-1 min-w-0 truncate">{preset.label}</span>
            <Select value={preset.mode} onValueChange={(v) => updateMode(index, v as 'psf' | 'flat')}>
              <SelectTrigger className="w-[90px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="psf">$/sqft</SelectItem>
                <SelectItem value="flat">Flat $</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-shrink-0">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                value={preset.pricePerSqft || ''}
                onChange={(e) => updateRate(index, parseFloat(e.target.value) || 0)}
                className="pl-5 h-7 w-20 text-xs text-right font-mono"
                placeholder="0"
              />
            </div>
            <button onClick={() => removePreset(index)} className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Select value={newCategoryValue} onValueChange={setNewCategoryValue}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Add a category..." />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={addPreset} disabled={!newCategoryValue}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground">
        <RotateCcw className="h-3 w-3 mr-1" />
        Reset to Defaults
      </Button>
    </div>
  );
}
