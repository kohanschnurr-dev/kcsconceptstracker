import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCustomItems, type CategoryItem } from '@/hooks/useCustomCategories';

interface ProjectInfoProps {
  projectId: string;
  projectType?: string;
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

export const CONTRACTOR_FIELDS: CategoryItem[] = [
  { value: 'client_name', label: 'Client Name' },
  { value: 'client_phone', label: 'Client Phone' },
  { value: 'client_email', label: 'Client Email' },
  { value: 'contract_type', label: 'Contract Type' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'site_contact', label: 'Site Contact' },
  { value: 'permit_number', label: 'Permit #' },
  { value: 'bond_insurance', label: 'Bond / Insurance #' },
  { value: 'scope_of_work', label: 'Scope of Work' },
];

const MULTILINE_FIELDS = new Set(['scope_of_work']);

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
  client_name: 'e.g. John Smith',
  client_phone: 'e.g. (555) 123-4567',
  client_email: 'e.g. john@example.com',
  contract_type: 'e.g. Fixed Price, T&M, Cost Plus',
  scope_of_work: 'Describe what is in scope for this job...',
  project_manager: 'e.g. Jane Doe',
  site_contact: 'e.g. Bob Johnson',
  permit_number: 'e.g. 2024-BLD-00123',
  bond_insurance: 'e.g. Policy #ABC123',
};

export function ProjectInfo({ projectId, projectType }: ProjectInfoProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [savedFields, setSavedFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [projectFields, setProjectFields] = useState<CategoryItem[]>([]);
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);

  const isContractor = projectType === 'contractor';

  const activeFields = isContractor
    ? getCustomItems('jobInfo', CONTRACTOR_FIELDS)
    : getCustomItems('propertyInfo', DEFAULT_PROPERTY_FIELDS);

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
        if (!isContractor) {
          for (const key of BUILT_IN_KEYS) {
            loaded[key] = (data as any)[key] || '';
          }
        }
        const rawCustom = (data as any).custom_fields || {};
        // Load project-specific field definitions
        const projectFieldDefs: CategoryItem[] = (rawCustom as any)._project_fields || [];
        setProjectFields(projectFieldDefs);
        // Load all custom field values (excluding the metadata key)
        for (const [key, val] of Object.entries(rawCustom)) {
          if (key === '_project_fields') continue;
          loaded[key] = (val as string) || '';
        }
        setFields(loaded);
        setSavedFields(loaded);
        setExistingId(data.id);
      }
      setLoading(false);
    };

    fetchInfo();
  }, [projectId, isContractor]);

  const persistCustomFields = async (
    newFields: Record<string, string>,
    newProjectFieldDefs: CategoryItem[]
  ) => {
    // Build custom_fields payload: all non-built-in values + _project_fields metadata
    const customPayload: Record<string, any> = { _project_fields: newProjectFieldDefs };
    for (const [key, val] of Object.entries(newFields)) {
      if (!BUILT_IN_KEYS.has(key)) {
        customPayload[key] = val || null;
      }
    }
    return customPayload;
  };

  const handleBlur = async (key: string) => {
    if (fields[key] === savedFields[key]) return;
    if (!user) return;

    const isBuiltIn = !isContractor && BUILT_IN_KEYS.has(key);

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
        const customFields = await persistCustomFields(fields, projectFields);
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
        insertData.custom_fields = await persistCustomFields(fields, projectFields);
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

  const handleAddProjectField = async (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    const key = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Check for duplicate key in global or project fields
    const allKeys = new Set([
      ...activeFields.map(f => f.value),
      ...projectFields.map(f => f.value),
    ]);
    if (allKeys.has(key)) {
      setDuplicateError(true);
      return;
    }
    setDuplicateError(false);

    const newDef: CategoryItem = { value: key, label: trimmed };
    const updatedProjectFields = [...projectFields, newDef];
    const updatedFields = { ...fields, [key]: '' };

    setProjectFields(updatedProjectFields);
    setFields(updatedFields);
    setSavedFields(prev => ({ ...prev, [key]: '' }));
    setNewFieldLabel('');
    setAddingField(false);

    // Persist
    const customPayload = await persistCustomFields(updatedFields, updatedProjectFields);
    if (existingId) {
      await supabase
        .from('project_info')
        .update({ custom_fields: customPayload } as any)
        .eq('id', existingId);
    } else if (user) {
      const { data, error } = await supabase
        .from('project_info')
        .insert({ project_id: projectId, user_id: user.id, custom_fields: customPayload })
        .select('id')
        .single();
      if (!error && data) setExistingId(data.id);
    }
  };

  const handleRemoveProjectField = async (key: string) => {
    const updatedProjectFields = projectFields.filter(f => f.value !== key);
    const updatedFields = { ...fields };
    delete updatedFields[key];
    const updatedSaved = { ...savedFields };
    delete updatedSaved[key];

    setProjectFields(updatedProjectFields);
    setFields(updatedFields);
    setSavedFields(updatedSaved);

    if (!existingId) return;
    const customPayload = await persistCustomFields(updatedFields, updatedProjectFields);
    await supabase
      .from('project_info')
      .update({ custom_fields: customPayload } as any)
      .eq('id', existingId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const showProjectSection = projectFields.length > 0 || addingField;

  return (
    <Card className="glass-card relative">
      <CardHeader>
        <CardTitle className="text-lg">
          {isContractor ? 'Job Details' : 'Property Info'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Global fields */}
          {activeFields.map(({ value: key, label }) => {
            const isMultiline = MULTILINE_FIELDS.has(key);
            return (
              <div key={key} className={`space-y-1.5${isMultiline ? ' sm:col-span-2' : ''}`}>
                <Label htmlFor={key} className="text-xs text-muted-foreground">
                  {label}
                </Label>
                {isMultiline ? (
                  <Textarea
                    id={key}
                    value={fields[key] || ''}
                    placeholder={PLACEHOLDER_MAP[key] || `Enter ${label.toLowerCase()}`}
                    className="min-h-[80px] resize-none"
                    onChange={(e) => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                    onBlur={() => handleBlur(key)}
                  />
                ) : (
                  <Input
                    id={key}
                    value={fields[key] || ''}
                    placeholder={PLACEHOLDER_MAP[key] || `Enter ${label.toLowerCase()}`}
                    onChange={(e) => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                    onBlur={() => handleBlur(key)}
                  />
                )}
              </div>
            );
          })}

          {/* Divider for project-specific section */}
          {showProjectSection && (
            <div className="col-span-full flex items-center gap-2 mt-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">Project-Specific</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {/* Project-specific fields */}
          {projectFields.map(({ value: key, label }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`pf-${key}`} className="text-xs text-muted-foreground">
                  {label}
                </Label>
                <button
                  onClick={() => handleRemoveProjectField(key)}
                  className="text-muted-foreground/50 hover:text-destructive transition-colors"
                  title="Remove field"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <Input
                id={`pf-${key}`}
                value={fields[key] || ''}
                placeholder={`Enter ${label.toLowerCase()}`}
                onChange={(e) => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                onBlur={() => handleBlur(key)}
              />
            </div>
          ))}

          {/* Add field inline form */}
          {addingField ? (
            <div className="col-span-full space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Field label (e.g. Plumbing Type)"
                  value={newFieldLabel}
                  autoFocus
                  onChange={e => { setNewFieldLabel(e.target.value); setDuplicateError(false); }}
                  onKeyDown={e => e.key === 'Enter' && handleAddProjectField(newFieldLabel)}
                  className={duplicateError ? 'border-destructive' : ''}
                />
                <Button
                  size="sm"
                  disabled={!newFieldLabel.trim()}
                  onClick={() => handleAddProjectField(newFieldLabel)}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setAddingField(false); setNewFieldLabel(''); setDuplicateError(false); }}
                >
                  Cancel
                </Button>
              </div>
              {duplicateError && (
                <p className="text-xs text-destructive">A field with this name already exists.</p>
              )}
            </div>
          ) : (
            <div className="col-span-full">
              <Button
                variant="ghost"
                size="sm"
                className="w-fit gap-1.5 text-muted-foreground"
                onClick={() => setAddingField(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Field
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 justify-end mt-4 text-xs text-muted-foreground/60">
          <Save className="h-3 w-3" />
          <span>Auto-saves</span>
        </div>
      </CardContent>
    </Card>
  );
}
