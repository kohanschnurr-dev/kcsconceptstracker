import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { CategoryItem } from '@/hooks/useCustomCategories';

type DbConfig = {
  tableName: 'business_expenses' | 'calendar_events' | 'procurement_items';
  columnName: string;
};

interface GenericReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: { value: string; label: string } | null;
  remainingItems: CategoryItem[];
  onComplete: (value: string) => void;
  /** If null, shows a simple "Are you sure?" with no DB check */
  dbConfig: DbConfig | null;
  sectionLabel?: string;
}

export default function GenericReassignDialog({
  open,
  onOpenChange,
  category,
  remainingItems,
  onComplete,
  dbConfig,
  sectionLabel = 'item',
}: GenericReassignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [targetValue, setTargetValue] = useState('');

  useEffect(() => {
    if (!open || !category) return;
    setTargetValue('');

    if (!dbConfig) {
      // Simple confirm mode — no DB check needed
      setUsageCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      const { count } = await (supabase
        .from(dbConfig.tableName) as any)
        .select('id', { count: 'exact', head: true })
        .eq(dbConfig.columnName, category.value);

      setUsageCount(count ?? 0);
      setLoading(false);
    })();
  }, [open, category, dbConfig]);

  const handleConfirm = async () => {
    if (!category) return;

    if (dbConfig && usageCount > 0) {
      if (!targetValue) {
        toast.error(`Please select a ${sectionLabel} to reassign to`);
        return;
      }

      setSaving(true);
      try {
        const updateObj: Record<string, string> = { [dbConfig.columnName]: targetValue };
        const { error } = await (supabase
          .from(dbConfig.tableName) as any)
          .update(updateObj)
          .eq(dbConfig.columnName, category.value);

        if (error) throw error;

        onComplete(category.value);
        onOpenChange(false);
        toast.success(`Reassigned ${usageCount} record(s) and removed "${category.label}"`);
      } catch (err) {
        console.error('Reassignment error:', err);
        toast.error('Failed to reassign records');
      } finally {
        setSaving(false);
      }
      return;
    }

    // No usage or simple confirm — just remove
    onComplete(category.value);
    onOpenChange(false);
    toast.success(`Removed "${category.label}"`);
  };

  const selectableItems = remainingItems.filter(c => c.value !== category?.value);
  const hasDbUsage = dbConfig && usageCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove "{category?.label}"?</DialogTitle>
          <DialogDescription>
            {loading
              ? 'Checking for existing usage…'
              : hasDbUsage
                ? `${usageCount} record(s) use this ${sectionLabel}. Choose a replacement before removing.`
                : dbConfig
                  ? `No records currently use this ${sectionLabel}. It will be removed.`
                  : `Are you sure you want to remove this ${sectionLabel}?`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {hasDbUsage && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Reassign to:</label>
                <Select value={targetValue} onValueChange={setTargetValue}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${sectionLabel}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableItems.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={saving || (!!hasDbUsage && !targetValue)}
              >
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {hasDbUsage ? 'Reassign & Remove' : 'Remove'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
