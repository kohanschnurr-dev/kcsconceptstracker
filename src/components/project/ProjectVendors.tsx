import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Users, Phone, Mail, Calendar, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  trade: string;
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
  vendor?: Vendor;
}

interface ProjectVendorsProps {
  projectId: string;
}

export function ProjectVendors({ projectId }: ProjectVendorsProps) {
  const [projectVendors, setProjectVendors] = useState<ProjectVendor[]>([]);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    // Fetch assigned vendors
    const { data: assignedData, error: assignedError } = await supabase
      .from('project_vendors')
      .select('*')
      .eq('project_id', projectId);

    if (assignedError) {
      console.error('Error fetching project vendors:', assignedError);
    }

    // Fetch all vendors
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .order('name');

    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError);
    }

    const vendors = vendorsData || [];
    const assigned = assignedData || [];

    // Map vendor details to project vendors
    const projectVendorsWithDetails = assigned.map(pv => ({
      ...pv,
      vendor: vendors.find(v => v.id === pv.vendor_id),
    }));

    setProjectVendors(projectVendorsWithDetails);

    // Filter out already assigned vendors
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
      });

    if (error) {
      toast.error('Failed to assign vendor');
      console.error(error);
    } else {
      toast.success('Vendor assigned');
      setSelectedVendorId('');
      setScheduledDate('');
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

    if (error) {
      toast.error('Failed to update schedule');
    } else {
      fetchData();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTradeBadgeColor = (trade: string) => {
    const colors: Record<string, string> = {
      foundation: 'bg-stone-500/20 text-stone-600',
      plumbing: 'bg-blue-500/20 text-blue-600',
      hvac: 'bg-cyan-500/20 text-cyan-600',
      electrical: 'bg-yellow-500/20 text-yellow-600',
      roof: 'bg-red-500/20 text-red-600',
      interior: 'bg-purple-500/20 text-purple-600',
      kitchen: 'bg-orange-500/20 text-orange-600',
      fixtures: 'bg-pink-500/20 text-pink-600',
      general: 'bg-gray-500/20 text-gray-600',
    };
    return colors[trade] || colors.general;
  };

  // Sort by scheduled date
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={availableVendors.length === 0}>
              <Plus className="h-4 w-4 mr-1" />
              Assign Vendor
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
                        {vendor.name} ({vendor.trade})
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
                      <Badge className={cn("text-xs", getTradeBadgeColor(pv.vendor?.trade || 'general'))}>
                        <Wrench className="h-3 w-3 mr-1" />
                        {pv.vendor?.trade}
                      </Badge>
                    </div>
                    
                    {/* Contact buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {pv.vendor?.phone && (
                        <a 
                          href={`tel:${pv.vendor.phone}`}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          {pv.vendor.phone}
                        </a>
                      )}
                      {pv.vendor?.email && (
                        <a 
                          href={`mailto:${pv.vendor.email}`}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          {pv.vendor.email}
                        </a>
                      )}
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2 mt-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={pv.scheduled_date || ''}
                        onChange={(e) => updateSchedule(pv.id, e.target.value)}
                        className="w-auto h-8 text-sm"
                      />
                      {pv.scheduled_date && (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(pv.scheduled_date)}
                        </span>
                      )}
                    </div>
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
        )}
      </CardContent>
    </Card>
  );
}
