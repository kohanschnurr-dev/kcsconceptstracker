import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCustomItems, type CategoryItem } from '@/hooks/useCustomCategories';

interface ProjectInfoProps {
  projectId: string;
}

export const DEFAULT_PROPERTY_FIELDS: CategoryItem[] = [
  { value: 'foundation_status', label: 'Foundation Status' },
  { value: 'gas_electric', label: 'Gas / Electric' },
  { value: 'roof_year', label: 'Roof Year' },
  { value: 'roof_type', label: 'Roof Type' },
  { value: 'hvac_year', label: 'HVAC Year' },
  { value: 'hvac_condenser', label: 'Condenser' },
  { value: 'hvac_furnace', label: 'Furnace' },
  { value: 'drain_line_material', label: 'Drain Line Material' },
  { value: 'window_status', label: 'Window Status' },
  { value: 'electrical_status', label: 'Electrical Status' },
  { value: 'plumbing_status', label: 'Plumbing Status' },
];

const BUILT_IN_KEYS = new Set(DEFAULT_PROPERTY_FIELDS.map(f => f.value));

const PLACEHOLDER_MAP: Record<string, string> = {
  foundation_status: 'e.g. Pier & beam, leveled',
  gas_electric: 'e.g. Gas, Electric, Both',
  roof_year: 'e.g. 2018',
  roof_type: 'e.g. Composition shingle',
  hvac_year: 'e.g. 2020',
  hvac_condenser: 'e.g. Trane 3-ton',
  hvac_furnace: 'e.g. Lennox 80k BTU',
  drain_line_material: 'e.g. Cast iron, PVC',
  window_status: 'e.g. Original single-pane',
  electrical_status: 'e.g. 200 amp, updated panel',
  plumbing_status: 'e.g. Copper supply, PVC waste',
};

export function ProjectInfo({ projectId }: ProjectInfoProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [savedFields, setSavedFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);

  const activeFields = getCustomItems('propertyInfo', DEFAULT_PROPERTY_FIELDS);

  useEffect(() => {
    const fetchInfo = async () => {
      const { data, error } = await supabase
        .from('project_info')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching project info:', error);
      } else if (data) {
        const loaded: Record<string, string> = {};
        // Load built-in columns
        for (const key of BUILT_IN_KEYS) {
          loaded[key] = (data as any)[key] || '';
        }
        // Load custom fields from JSONB
        const customFields = (data as any).custom_fields || {};
        for (const [key, val] of Object.entries(customFields)) {
          loaded[key] = (val as string) || '';
        }
        setFields(loaded);
        setSavedFields(loaded);
        setExistingId(data.id);
      }
      setLoading(false);
    };

    fetchInfo();
  }, [projectId]);

  const handleBlur = async (key: string) => {
    if (fields[key] === savedFields[key]) return;
    if (!user) return;

    const isBuiltIn = BUILT_IN_KEYS.has(key);

    if (existingId) {
      if (isBuiltIn) {
        const { error } = await supabase
          .from('project_info')
          .update({ [key]: fields[key] || null } as any)
          .eq('id', existingId);
        if (error) {
          console.error('Error updating project info:', error);
          toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
          return;
        }
      } else {
        // Update custom_fields JSONB
        const { data: current } = await supabase
          .from('project_info')
          .select('custom_fields')
          .eq('id', existingId)
          .single();
        const customFields = { ...((current as any)?.custom_fields || {}), [key]: fields[key] || null };
        const { error } = await supabase
          .from('project_info')
          .update({ custom_fields: customFields } as any)
          .eq('id', existingId);
        if (error) {
          console.error('Error updating custom field:', error);
          toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
          return;
        }
      }
    } else {
      const insertData: any = { project_id: projectId, user_id: user.id };
      if (isBuiltIn) {
        insertData[key] = fields[key] || null;
      } else {
        insertData.custom_fields = { [key]: fields[key] || null };
      }
      const { data, error } = await supabase
        .from('project_info')
        .insert(insertData)
        .select('id')
        .single();
      if (error) {
        console.error('Error creating project info:', error);
        toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
        return;
      }
      setExistingId(data.id);
    }

    setSavedFields(prev => ({ ...prev, [key]: fields[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="glass-card relative">
      <CardHeader>
        <CardTitle className="text-lg">Property Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeFields.map(({ value: key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key} className="text-xs text-muted-foreground">
                {label}
              </Label>
              <Input
                id={key}
                value={fields[key] || ''}
                placeholder={PLACEHOLDER_MAP[key] || `Enter ${label.toLowerCase()}`}
                onChange={(e) => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                onBlur={() => handleBlur(key)}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 justify-end mt-4 text-xs text-muted-foreground/60">
          <Save className="h-3 w-3" />
          <span>Auto-saves</span>
        </div>
      </CardContent>
    </Card>
  );
}
