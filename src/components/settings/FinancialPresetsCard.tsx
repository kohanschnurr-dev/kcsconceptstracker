import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { triggerSettingsSync } from '@/hooks/useSettingsSync';

type CostMode = 'pct' | 'flat';

interface FinancialPreset {
  name: string;
  closingPct: number;
  holdingPct: number;
  closingMode: CostMode;
  holdingMode: CostMode;
  closingFlat: number;
  holdingFlat: number;
  isDefault?: boolean;
}

const DEFAULT_PRESETS: FinancialPreset[] = [
  { name: 'Standard', closingPct: 6, holdingPct: 3, closingMode: 'pct', holdingMode: 'pct', closingFlat: 0, holdingFlat: 0, isDefault: true },
];

const PRESETS_KEY = 'profit-calculator-presets';

function loadPresets(): FinancialPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinancialPreset[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [...DEFAULT_PRESETS];
}

function savePresets(presets: FinancialPreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  triggerSettingsSync();
}

export default function FinancialPresetsCard() {
  const [presets, setPresets] = useState<FinancialPreset[]>(loadPresets);
  const [newName, setNewName] = useState('');
  const [newClosingPct, setNewClosingPct] = useState(6);
  const [newHoldingPct, setNewHoldingPct] = useState(3);

  useEffect(() => {
    const handler = () => setPresets(loadPresets());
    window.addEventListener('settings-synced', handler);
    return () => window.removeEventListener('settings-synced', handler);
  }, []);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (presets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A preset with that name already exists');
      return;
    }
    const newPreset: FinancialPreset = {
      name,
      closingPct: newClosingPct,
      holdingPct: newHoldingPct,
      closingMode: 'pct',
      holdingMode: 'pct',
      closingFlat: 0,
      holdingFlat: 0,
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(updated);
    setNewName('');
    setNewClosingPct(6);
    setNewHoldingPct(3);
    toast.success(`Preset "${name}" saved`);
  };

  const handleDelete = (presetName: string) => {
    const updated = presets.filter(p => p.name !== presetName);
    setPresets(updated.length > 0 ? updated : [...DEFAULT_PRESETS]);
    savePresets(updated.length > 0 ? updated : [...DEFAULT_PRESETS]);
    toast.success('Preset deleted');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Presets
        </CardTitle>
        <CardDescription>
          Manage default closing & holding cost assumptions for the Profit Calculator
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing presets */}
        <div className="space-y-2">
          {presets.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <span className="font-medium text-sm">{p.name}</span>
                <span className="ml-3 text-xs text-muted-foreground">
                  Closing {p.closingMode === 'pct' ? `${p.closingPct}%` : `$${p.closingFlat}`} · Holding {p.holdingMode === 'pct' ? `${p.holdingPct}%` : `$${p.holdingFlat}`}
                </span>
              </div>
              {!p.isDefault && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.name)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add new preset */}
        <div className="rounded-md border p-3 space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground">Add New Preset</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Hard Money Deal"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Closing %</Label>
              <Input
                type="number"
                value={newClosingPct || ''}
                onChange={(e) => setNewClosingPct(Number(e.target.value))}
                placeholder="6"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Holding %</Label>
              <Input
                type="number"
                value={newHoldingPct || ''}
                onChange={(e) => setNewHoldingPct(Number(e.target.value))}
                placeholder="3"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Preset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
