import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProjectInfoProps {
  projectId: string;
}

interface InfoFields {
  foundation_status: string;
  gas_electric: string;
  roof_year: string;
  roof_type: string;
  hvac_year: string;
  hvac_condenser: string;
  hvac_furnace: string;
  drain_line_material: string;
  window_status: string;
  electrical_status: string;
  plumbing_status: string;
}

const EMPTY_FIELDS: InfoFields = {
  foundation_status: '',
  gas_electric: '',
  roof_year: '',
  roof_type: '',
  hvac_year: '',
  hvac_condenser: '',
  hvac_furnace: '',
  drain_line_material: '',
  window_status: '',
  electrical_status: '',
  plumbing_status: '',
};

const FIELD_CONFIG: { key: keyof InfoFields; label: string; placeholder: string }[] = [
  { key: 'foundation_status', label: 'Foundation Status', placeholder: 'e.g. Pier & beam, leveled' },
  { key: 'gas_electric', label: 'Gas / Electric', placeholder: 'e.g. Gas, Electric, Both' },
  { key: 'roof_year', label: 'Roof Year', placeholder: 'e.g. 2018' },
  { key: 'roof_type', label: 'Roof Type', placeholder: 'e.g. Composition shingle' },
  { key: 'hvac_year', label: 'HVAC Year', placeholder: 'e.g. 2020' },
  { key: 'hvac_condenser', label: 'Condenser', placeholder: 'e.g. Trane 3-ton' },
  { key: 'hvac_furnace', label: 'Furnace', placeholder: 'e.g. Lennox 80k BTU' },
  { key: 'drain_line_material', label: 'Drain Line Material', placeholder: 'e.g. Cast iron, PVC' },
  { key: 'window_status', label: 'Window Status', placeholder: 'e.g. Original single-pane' },
  { key: 'electrical_status', label: 'Electrical Status', placeholder: 'e.g. 200 amp, updated panel' },
  { key: 'plumbing_status', label: 'Plumbing Status', placeholder: 'e.g. Copper supply, PVC waste' },
];

export function ProjectInfo({ projectId }: ProjectInfoProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fields, setFields] = useState<InfoFields>(EMPTY_FIELDS);
  const [savedFields, setSavedFields] = useState<InfoFields>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);

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
        const loaded: InfoFields = {
          foundation_status: data.foundation_status || '',
          gas_electric: data.gas_electric || '',
          roof_year: data.roof_year || '',
          roof_type: data.roof_type || '',
          hvac_year: data.hvac_year || '',
          hvac_condenser: data.hvac_condenser || '',
          hvac_furnace: data.hvac_furnace || '',
          drain_line_material: data.drain_line_material || '',
          window_status: data.window_status || '',
          electrical_status: data.electrical_status || '',
          plumbing_status: data.plumbing_status || '',
        };
        setFields(loaded);
        setSavedFields(loaded);
        setExistingId(data.id);
      }
      setLoading(false);
    };

    fetchInfo();
  }, [projectId]);

  const handleBlur = async (key: keyof InfoFields) => {
    if (fields[key] === savedFields[key]) return;
    if (!user) return;

    const updates = { [key]: fields[key] || null };

    if (existingId) {
      const { error } = await supabase
        .from('project_info')
        .update(updates)
        .eq('id', existingId);

      if (error) {
        console.error('Error updating project info:', error);
        toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('project_info')
        .insert({ project_id: projectId, user_id: user.id, ...updates })
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
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Property Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELD_CONFIG.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key} className="text-xs text-muted-foreground">
                {label}
              </Label>
              <Input
                id={key}
                value={fields[key]}
                placeholder={placeholder}
                onChange={(e) => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                onBlur={() => handleBlur(key)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
