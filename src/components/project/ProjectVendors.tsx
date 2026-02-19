import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Users, Phone, Mail, Calendar, Wrench, FileText, X, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/dateUtils';

interface LineItem {
  description: string;
  amount: number;
}

interface Vendor {
  id: string;
  name: string;
  trades: string[];
  phone: string | null;
  email: string | null;
  reliability_rating: number | null;
}

interface ProjectVendor {
  id: string;
  project_id: string;
  vendor_id: string;
  scheduled_date: string | null;
  notes: string | null;
  line_items: LineItem[];
  vendor?: Vendor;
}

interface ProjectVendorsProps {
  projectId: string;
}

function VendorLineItems({ 
  projectVendorId, 
  lineItems, 
  onUpdate 
}: { 
  projectVendorId: string; 
  lineItems: LineItem[]; 
  onUpdate: () => void;
}) {
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const saveLineItems = async (updated: LineItem[]) => {
    const { error } = await supabase
      .from('project_vendors')
      .update({ line_items: updated as any })
      .eq('id', projectVendorId);
    if (error) {
      toast.error('Failed to update line items');
    } else {
      onUpdate();
    }
  };

  const addItem = async () => {
    const desc = newDesc.trim();
    const amt = parseFloat(newAmount);
    if (!desc || isNaN(amt)) return;
    await saveLineItems([...lineItems, { description: desc, amount: amt }]);
    setNewDesc('');
    setNewAmount('');
  };

  const removeItem = async (index: number) => {
    await saveLineItems(lineItems.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-3">
      <span className="text-xs font-medium text-muted-foreground">Line Items</span>
      {lineItems.length > 0 && (
        <div className="mt-1 space-y-1">
          {lineItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-sm group">
              <span className="flex-1 truncate">{item.description}</span>
              <span className="font-medium tabular-nums">${item.amount.toLocaleString()}</span>
              <button
                onClick={() => removeItem(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex justify-end text-sm font-semibold pt-1 border-t border-border/50">
            Total: ${total.toLocaleString()}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mt-2">
        <Input
          placeholder="Description"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          className="h-8 text-sm flex-1"
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <Input
          type="number"
          placeholder="$"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          className="h-8 text-sm w-24"
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={addItem} disabled={!newDesc.trim() || !newAmount}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProjectVendors({ projectId }: ProjectVendorsProps) {
  const [projectVendors, setProjectVendors] = useState<ProjectVendor[]>([]);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assignLineItems, setAssignLineItems] = useState<LineItem[]>([]);
  const [assignNewDesc, setAssignNewDesc] = useState('');
  const [assignNewAmount, setAssignNewAmount] = useState('');

  const fetchData = async () => {
    const { data: assignedData, error: assignedError } = await supabase
      .from('project_vendors')
      .select('*')
      .eq('project_id', projectId);

    if (assignedError) console.error('Error fetching project vendors:', assignedError);

    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .order('name');

    if (vendorsError) console.error('Error fetching vendors:', vendorsError);

    const vendors = vendorsData || [];
    const assigned = assignedData || [];

    const projectVendorsWithDetails = assigned.map(pv => ({
      ...pv,
      line_items: (pv.line_items as any as LineItem[]) || [],
      vendor: vendors.find(v => v.id === pv.vendor_id),
    }));

    setProjectVendors(projectVendorsWithDetails);
    const assignedIds = assigned.map(pv => pv.vendor_id);
    setAvailableVendors(vendors.filter(v => !assignedIds.includes(v.id)));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleAssign = async () => {
    if (!selectedVendorId) return;
    setSubmitting(true);

    const { error } = await supabase
      .from('project_vendors')
      .insert({
        project_id: projectId,
        vendor_id: selectedVendorId,
        scheduled_date: scheduledDate || null,
        line_items: assignLineItems as any,
      });

    if (error) {
      toast.error('Failed to assign vendor');
      console.error(error);
    } else {
      toast.success('Vendor assigned');
      setSelectedVendorId('');
      setScheduledDate('');
      setAssignLineItems([]);
      setIsOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase
      .from('project_vendors')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove vendor');
    } else {
      toast.success('Vendor removed');
      fetchData();
    }
  };

  const updateSchedule = async (id: string, date: string) => {
    const { error } = await supabase
      .from('project_vendors')
      .update({ scheduled_date: date || null })
      .eq('id', id);

    if (error) toast.error('Failed to update schedule');
    else fetchData();
  };

  const updateNotes = async (id: string, notes: string) => {
    const { error } = await supabase
      .from('project_vendors')
      .update({ notes: notes || null })
      .eq('id', id);

    if (error) toast.error('Failed to update notes');
  };

  const formatTrade = (trade: string) => {
    return trade.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const addAssignLineItem = () => {
    const desc = assignNewDesc.trim();
    const amt = parseFloat(assignNewAmount);
    if (!desc || isNaN(amt)) return;
    setAssignLineItems(prev => [...prev, { description: desc, amount: amt }]);
    setAssignNewDesc('');
    setAssignNewAmount('');
  };

  const sortedVendors = [...projectVendors].sort((a, b) => {
    if (!a.scheduled_date && !b.scheduled_date) return 0;
    if (!a.scheduled_date) return 1;
    if (!b.scheduled_date) return -1;
    return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
  });

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Assigned Vendors ({projectVendors.length})
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setAssignLineItems([]); setAssignNewDesc(''); setAssignNewAmount(''); } }}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={availableVendors.length === 0} className="px-2 sm:px-3">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Assign Vendor</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Vendor to Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Vendor *</Label>
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scheduled Date (optional)</Label>
                <Input 
                  type="date"
                  value={scheduledDate} 
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Line Items (optional)</Label>
                {assignLineItems.length > 0 && (
                  <div className="space-y-1 mt-1 mb-2">
                    {assignLineItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex-1 truncate">{item.description}</span>
                        <span className="font-medium tabular-nums">${item.amount.toLocaleString()}</span>
                        <button onClick={() => setAssignLineItems(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input placeholder="Description" value={assignNewDesc} onChange={(e) => setAssignNewDesc(e.target.value)} className="h-8 text-sm flex-1" onKeyDown={(e) => e.key === 'Enter' && addAssignLineItem()} />
                  <Input type="number" placeholder="$" value={assignNewAmount} onChange={(e) => setAssignNewAmount(e.target.value)} className="h-8 text-sm w-24" onKeyDown={(e) => e.key === 'Enter' && addAssignLineItem()} />
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={addAssignLineItem} disabled={!assignNewDesc.trim() || !assignNewAmount}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={handleAssign} disabled={!selectedVendorId || submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Assign Vendor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : projectVendors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No vendors assigned yet. Assign vendors to track who's working on this project!
          </p>
        ) : (
          <TooltipProvider>
          <div className="space-y-3">
            {sortedVendors.map(pv => (
              <div 
                key={pv.id}
                className="p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{pv.vendor?.name || 'Unknown'}</span>
                      {pv.vendor?.trades && pv.vendor.trades.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex cursor-help">
                              <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">{pv.vendor.trades.map(formatTrade).join(', ')}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {pv.vendor?.phone && (
                        <a href={`tel:${pv.vendor.phone}`} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <Phone className="h-3 w-3" />
                          {pv.vendor.phone}
                        </a>
                      )}
                      {pv.vendor?.email && (
                        <a href={`mailto:${pv.vendor.email}`} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <Mail className="h-3 w-3" />
                          <span className="hidden sm:inline">{pv.vendor.email}</span>
                          <span className="sm:hidden">Email</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={pv.scheduled_date || ''}
                        onChange={(e) => updateSchedule(pv.id, e.target.value)}
                        className="w-auto h-8 text-sm"
                      />
                    </div>

                    <VendorLineItems
                      projectVendorId={pv.id}
                      lineItems={pv.line_items}
                      onUpdate={fetchData}
                    />

                    <Collapsible className="mt-3">
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronDown className="h-3 w-3" />
                        <FileText className="h-3 w-3" />
                        Notes
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1">
                        <Textarea
                          placeholder="General notes about this vendor on this project..."
                          defaultValue={pv.notes || ''}
                          onBlur={(e) => updateNotes(pv.id, e.target.value)}
                          className="text-sm min-h-[60px] resize-none"
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(pv.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
