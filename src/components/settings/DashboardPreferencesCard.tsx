import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BarChart3 } from 'lucide-react';
import { triggerSettingsSync } from '@/hooks/useSettingsSync';

const STORAGE_KEY = 'dashboard-profit-filters';

interface ProfitFilters {
  types: string[];
  statuses: string[];
}

const DEFAULT_FILTERS: ProfitFilters = {
  types: ['fix_flip', 'rental', 'new_construction', 'wholesaling'],
  statuses: ['active'],
};

const PROJECT_TYPES = [
  { value: 'fix_flip', label: 'Fix & Flip' },
  { value: 'wholesaling', label: 'Wholesaling' },
  { value: 'rental', label: 'Rental' },
  { value: 'new_construction', label: 'New Construction' },
];

const PROJECT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Completed' },
];

function loadFilters(): ProfitFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_FILTERS;
}

export default function DashboardPreferencesCard() {
  const [filters, setFilters] = useState<ProfitFilters>(loadFilters);

  useEffect(() => {
    const handleSync = () => setFilters(loadFilters());
    window.addEventListener('settings-synced', handleSync);
    return () => window.removeEventListener('settings-synced', handleSync);
  }, []);

  const save = (next: ProfitFilters) => {
    setFilters(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    triggerSettingsSync();
  };

  const toggleType = (value: string) => {
    const types = filters.types.includes(value)
      ? filters.types.filter(t => t !== value)
      : [...filters.types, value];
    save({ ...filters, types });
  };

  const toggleStatus = (value: string) => {
    const statuses = filters.statuses.includes(value)
      ? filters.statuses.filter(s => s !== value)
      : [...filters.statuses, value];
    save({ ...filters, statuses });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Dashboard Preferences
        </CardTitle>
        <CardDescription>Configure which projects appear in your dashboard profit stats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Profit Potential – Project Types</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PROJECT_TYPES.map(t => (
              <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.types.includes(t.value)}
                  onCheckedChange={() => toggleType(t.value)}
                />
                <span className="text-sm">{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Profit Potential – Status</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PROJECT_STATUSES.map(s => (
              <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.statuses.includes(s.value)}
                  onCheckedChange={() => toggleStatus(s.value)}
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
