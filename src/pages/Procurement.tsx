import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  ExternalLink,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Pencil,
  Trash2,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ItemStatus = 'researching' | 'in_cart' | 'ordered' | 'delivered' | 'installed';
type Phase = 'rough_in' | 'trim_out' | 'finish' | 'punch';
type SourceStore = 'amazon' | 'home_depot' | 'lowes' | 'floor_decor' | 'build' | 'other';

interface ProcurementItem {
  id: string;
  project_id: string | null;
  category_id: string | null;
  name: string;
  source_url: string | null;
  source_store: SourceStore | null;
  model_number: string | null;
  unit_price: number;
  quantity: number;
  includes_tax: boolean;
  tax_rate: number;
  lead_time_days: number | null;
  phase: Phase | null;
  status: ItemStatus;
  finish: string | null;
  notes: string | null;
  bulk_discount_eligible: boolean;
}

interface Project {
  id: string;
  name: string;
  address: string;
}

const PHASES: { value: Phase; label: string }[] = [
  { value: 'rough_in', label: 'Rough-In' },
  { value: 'trim_out', label: 'Trim Out' },
  { value: 'finish', label: 'Finish' },
  { value: 'punch', label: 'Punch List' },
];

const STATUSES: { value: ItemStatus; label: string; icon: typeof Package; color: string }[] = [
  { value: 'researching', label: 'Researching', icon: Search, color: 'text-muted-foreground' },
  { value: 'in_cart', label: 'In Cart', icon: ShoppingCart, color: 'text-warning' },
  { value: 'ordered', label: 'Ordered', icon: Truck, color: 'text-blue-500' },
  { value: 'delivered', label: 'Delivered', icon: Package, color: 'text-primary' },
  { value: 'installed', label: 'Installed', icon: CheckCircle2, color: 'text-success' },
];

const STORES: { value: SourceStore; label: string }[] = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'home_depot', label: 'Home Depot' },
  { value: 'lowes', label: "Lowe's" },
  { value: 'floor_decor', label: 'Floor & Decor' },
  { value: 'build', label: 'Build.com' },
  { value: 'other', label: 'Other' },
];

const TEXAS_TAX_RATE = 0.0825;

export default function Procurement() {
  const { user } = useAuth();
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcurementItem | null>(null);

  const fetchData = async () => {
    if (!user) return;
    
    const [itemsResult, projectsResult] = await Promise.all([
      supabase
        .from('procurement_items')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('projects')
        .select('id, name, address')
        .order('name')
    ]);

    if (itemsResult.data) {
      setItems(itemsResult.data as ProcurementItem[]);
    }
    if (projectsResult.data) {
      setProjects(projectsResult.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateItemTotal = (item: ProcurementItem) => {
    const subtotal = item.unit_price * item.quantity;
    const tax = item.includes_tax ? 0 : subtotal * item.tax_rate;
    return subtotal + tax;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesPhase = filterPhase === 'all' || item.phase === filterPhase;
    const matchesProject = filterProject === 'all' || 
      (filterProject === 'unassigned' ? !item.project_id : item.project_id === filterProject);
    return matchesSearch && matchesStatus && matchesPhase && matchesProject;
  });

  // Summary stats
  const cartTotal = filteredItems
    .filter(i => i.status === 'in_cart')
    .reduce((sum, i) => sum + calculateItemTotal(i), 0);
  
  const orderedTotal = filteredItems
    .filter(i => i.status === 'ordered')
    .reduce((sum, i) => sum + calculateItemTotal(i), 0);

  const totalItems = filteredItems.length;
  const unassignedCount = filteredItems.filter(i => !i.project_id).length;

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('procurement_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete item');
    } else {
      toast.success('Item deleted');
      fetchData();
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    const statusInfo = STATUSES.find(s => s.value === status);
    if (!statusInfo) return null;
    const Icon = statusInfo.icon;
    return (
      <Badge variant="outline" className={cn('gap-1', statusInfo.color)}>
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return 'Unassigned';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Procurement
            </h1>
            <p className="text-muted-foreground">Manage materials and product specifications across all projects</p>
          </div>
          <Button onClick={() => { setEditingItem(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Items</span>
              </div>
              <p className="text-2xl font-bold">{totalItems}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">In Cart</span>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(cartTotal)}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Ordered</span>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(orderedTotal)}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Unassigned</span>
              </div>
              <p className="text-2xl font-bold">{unassignedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items, model numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-full md:w-48">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="w-full md:w-40">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Phases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {PHASES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Items ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-1">No items yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start adding items to your procurement list</p>
                <Button onClick={() => { setEditingItem(null); setModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.model_number && (
                              <p className="text-xs text-muted-foreground">#{item.model_number}</p>
                            )}
                            {item.finish && (
                              <Badge variant="secondary" className="text-xs mt-1">{item.finish}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-sm",
                            !item.project_id && "text-muted-foreground italic"
                          )}>
                            {getProjectName(item.project_id)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">
                              {STORES.find(s => s.value === item.source_store)?.label || '-'}
                            </span>
                            {item.source_url && (
                              <a 
                                href={item.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {PHASES.find(p => p.value === item.phase)?.label || '-'}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(calculateItemTotal(item))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => { setEditingItem(item); setModalOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <ProcurementItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={editingItem}
        projects={projects}
        onSave={fetchData}
      />
    </MainLayout>
  );
}

// Modal Component
function ProcurementItemModal({
  open,
  onOpenChange,
  item,
  projects,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProcurementItem | null;
  projects: Project[];
  onSave: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    project_id: '',
    source_url: '',
    source_store: 'home_depot' as SourceStore,
    model_number: '',
    unit_price: '',
    quantity: '1',
    includes_tax: false,
    lead_time_days: '',
    phase: 'rough_in' as Phase,
    status: 'researching' as ItemStatus,
    finish: '',
    notes: '',
    bulk_discount_eligible: false,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        project_id: item.project_id || '',
        source_url: item.source_url || '',
        source_store: item.source_store || 'home_depot',
        model_number: item.model_number || '',
        unit_price: item.unit_price.toString(),
        quantity: item.quantity.toString(),
        includes_tax: item.includes_tax,
        lead_time_days: item.lead_time_days?.toString() || '',
        phase: item.phase || 'rough_in',
        status: item.status,
        finish: item.finish || '',
        notes: item.notes || '',
        bulk_discount_eligible: item.bulk_discount_eligible,
      });
    } else {
      setFormData({
        name: '',
        project_id: '',
        source_url: '',
        source_store: 'home_depot',
        model_number: '',
        unit_price: '',
        quantity: '1',
        includes_tax: false,
        lead_time_days: '',
        phase: 'rough_in',
        status: 'researching',
        finish: '',
        notes: '',
        bulk_discount_eligible: false,
      });
    }
  }, [item, open]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.unit_price) {
      toast.error('Name and price are required');
      return;
    }

    setLoading(true);
    const payload = {
      name: formData.name,
      project_id: formData.project_id || null,
      source_url: formData.source_url || null,
      source_store: formData.source_store,
      model_number: formData.model_number || null,
      unit_price: parseFloat(formData.unit_price),
      quantity: parseInt(formData.quantity) || 1,
      includes_tax: formData.includes_tax,
      tax_rate: TEXAS_TAX_RATE,
      lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : null,
      phase: formData.phase,
      status: formData.status,
      finish: formData.finish || null,
      notes: formData.notes || null,
      bulk_discount_eligible: formData.bulk_discount_eligible,
      user_id: user?.id,
    };

    let error;
    if (item) {
      const result = await supabase
        .from('procurement_items')
        .update(payload)
        .eq('id', item.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('procurement_items')
        .insert(payload);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast.error('Failed to save item');
      console.error(error);
    } else {
      toast.success(item ? 'Item updated' : 'Item added');
      onOpenChange(false);
      onSave();
    }
  };

  const subtotal = (parseFloat(formData.unit_price) || 0) * (parseInt(formData.quantity) || 1);
  const tax = formData.includes_tax ? 0 : subtotal * TEXAS_TAX_RATE;
  const total = subtotal + tax;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add Procurement Item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Item Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Delta Faucet Matte Black"
              />
            </div>

            <div className="col-span-2">
              <Label>Assign to Project</Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(v) => setFormData({ ...formData, project_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Source Store</Label>
              <Select 
                value={formData.source_store} 
                onValueChange={(v) => setFormData({ ...formData, source_store: v as SourceStore })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Source URL</Label>
              <Input
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Model Number</Label>
              <Input
                value={formData.model_number}
                onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                placeholder="SKU or model #"
              />
            </div>

            <div>
              <Label>Finish / Color</Label>
              <Input
                value={formData.finish}
                onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                placeholder="e.g., Matte Black"
              />
            </div>

            <div>
              <Label>Unit Price *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min="1"
              />
            </div>

            <div>
              <Label>Phase</Label>
              <Select 
                value={formData.phase} 
                onValueChange={(v) => setFormData({ ...formData, phase: v as Phase })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData({ ...formData, status: v as ItemStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Lead Time (days)</Label>
              <Input
                type="number"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.includes_tax}
                onCheckedChange={(v) => setFormData({ ...formData, includes_tax: v })}
              />
              <Label>Price includes tax</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.bulk_discount_eligible}
                onCheckedChange={(v) => setFormData({ ...formData, bulk_discount_eligible: v })}
              />
              <Label>HD Pro Desk eligible</Label>
            </div>
          </div>

          {/* Price Summary */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (8.25%):</span>
                  <span className="font-mono">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Total:</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
