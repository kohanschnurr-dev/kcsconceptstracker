import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Link as LinkIcon,
  Package,
  Clock,
  DollarSign,
  Truck,
  CheckCircle2,
  Search,
  Filter,
  ExternalLink,
  Pencil,
  Trash2,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BUDGET_CATEGORIES } from '@/types';

// Types
type SourceStore = 'amazon' | 'home_depot' | 'lowes' | 'other';
type Phase = 'demo' | 'rough_in' | 'drywall' | 'trim_out' | 'final';
type ItemStatus = 'researching' | 'in_cart' | 'ordered' | 'shipped' | 'on_site' | 'installed';

interface ProcurementItem {
  id: string;
  project_id: string;
  category_id: string | null;
  name: string;
  source_url: string | null;
  source_store: SourceStore | null;
  model_number: string | null;
  finish: string | null;
  unit_price: number;
  quantity: number;
  includes_tax: boolean;
  tax_rate: number;
  phase: Phase;
  lead_time_days: number | null;
  status: ItemStatus;
  bulk_discount_eligible: boolean;
  notes: string | null;
  created_at: string;
}

interface CategoryBudget {
  id: string;
  category: string;
  estimated_budget: number;
  actualSpent: number;
}

interface ProcurementTabProps {
  projectId: string;
  categories: CategoryBudget[];
  currency?: string;
}

const PHASES = [
  { value: 'demo', label: 'Demo', order: 1 },
  { value: 'rough_in', label: 'Rough-in', order: 2 },
  { value: 'drywall', label: 'Drywall', order: 3 },
  { value: 'trim_out', label: 'Trim Out', order: 4 },
  { value: 'final', label: 'Final', order: 5 },
];

const STATUSES = [
  { value: 'researching', label: 'Researching', icon: Search, color: 'text-muted-foreground' },
  { value: 'in_cart', label: 'In Cart', icon: ShoppingCart, color: 'text-warning' },
  { value: 'ordered', label: 'Ordered', icon: Package, color: 'text-blue-500' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'text-purple-500' },
  { value: 'on_site', label: 'On Site', icon: CheckCircle2, color: 'text-success' },
  { value: 'installed', label: 'Installed', icon: CheckCircle2, color: 'text-success' },
];

const STORES = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'home_depot', label: 'Home Depot' },
  { value: 'lowes', label: "Lowe's" },
  { value: 'other', label: 'Other' },
];

const TEXAS_TAX_RATE = 0.0825;

export function ProcurementTab({ projectId, categories, currency = '$' }: ProcurementTabProps) {
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcurementItem | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterFinish, setFilterFinish] = useState<string>('all');
  
  // View toggles
  const [showByPhase, setShowByPhase] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['rough_in', 'trim_out']));

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('procurement_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching procurement items:', error);
      toast.error('Failed to load procurement items');
    } else {
      // Cast the data to ProcurementItem[] to handle Supabase's string types
      setItems((data || []) as unknown as ProcurementItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [projectId]);

  // Format helpers
  const formatCurrency = (value: number) => `${currency}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getCategoryName = (catId: string | null) => {
    if (!catId) return 'Uncategorized';
    const cat = categories.find(c => c.id === catId);
    if (!cat) return 'Unknown';
    const budgetCat = BUDGET_CATEGORIES.find(bc => bc.value === cat.category);
    return budgetCat?.label || cat.category;
  };

  // Get unique finishes for filter
  const uniqueFinishes = useMemo(() => {
    const finishes = new Set(items.map(i => i.finish).filter(Boolean));
    return Array.from(finishes) as string[];
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.model_number?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterPhase !== 'all' && item.phase !== filterPhase) return false;
      if (filterFinish !== 'all' && item.finish !== filterFinish) return false;
      return true;
    });
  }, [items, searchQuery, filterStatus, filterPhase, filterFinish]);

  // Group by phase
  const itemsByPhase = useMemo(() => {
    const grouped: Record<string, ProcurementItem[]> = {};
    PHASES.forEach(p => grouped[p.value] = []);
    filteredItems.forEach(item => {
      if (grouped[item.phase]) {
        grouped[item.phase].push(item);
      }
    });
    return grouped;
  }, [filteredItems]);

  // Calculate totals
  const totals = useMemo(() => {
    const calculateItemTotal = (item: ProcurementItem) => {
      const subtotal = item.unit_price * item.quantity;
      return item.includes_tax ? subtotal * (1 + item.tax_rate) : subtotal;
    };

    const cartTotal = filteredItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const orderedTotal = filteredItems
      .filter(i => ['ordered', 'shipped', 'on_site', 'installed'].includes(i.status))
      .reduce((sum, item) => sum + calculateItemTotal(item), 0);
    
    // Cost-to-complete by category
    const byCategoryId: Record<string, { procured: number; budget: number; spent: number }> = {};
    categories.forEach(cat => {
      byCategoryId[cat.id] = { 
        procured: 0, 
        budget: cat.estimated_budget, 
        spent: cat.actualSpent 
      };
    });
    filteredItems.forEach(item => {
      if (item.category_id && byCategoryId[item.category_id]) {
        byCategoryId[item.category_id].procured += calculateItemTotal(item);
      }
    });

    return { cartTotal, orderedTotal, byCategoryId };
  }, [filteredItems, categories]);

  // Bulk discount check (HD Pro Desk threshold ~$1500)
  const bulkEligibleItems = useMemo(() => {
    return filteredItems.filter(i => 
      i.source_store === 'home_depot' && 
      (i.unit_price * i.quantity) >= 1500
    );
  }, [filteredItems]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('procurement_items').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete item');
    } else {
      toast.success('Item deleted');
      fetchItems();
    }
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    const s = STATUSES.find(st => st.value === status);
    if (!s) return null;
    const Icon = s.icon;
    return (
      <Badge variant="outline" className={cn("text-xs", s.color)}>
        <Icon className="h-3 w-3 mr-1" />
        {s.label}
      </Badge>
    );
  };

  const renderItemRow = (item: ProcurementItem) => {
    const itemTotal = item.unit_price * item.quantity * (item.includes_tax ? 1 + item.tax_rate : 1);
    return (
      <TableRow key={item.id} className="group hover:bg-muted/50">
        <TableCell className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium truncate">{item.name}</p>
            {item.model_number && (
              <p className="text-xs text-muted-foreground">#{item.model_number}</p>
            )}
            {item.source_url && (
              <a 
                href={item.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                {STORES.find(s => s.value === item.source_store)?.label || 'Link'}
              </a>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="text-xs">
            {getCategoryName(item.category_id)}
          </Badge>
        </TableCell>
        <TableCell>
          {item.finish && (
            <span className="text-sm">{item.finish}</span>
          )}
        </TableCell>
        <TableCell className="text-right font-mono">
          {formatCurrency(item.unit_price)}
          {item.quantity > 1 && (
            <span className="text-muted-foreground text-xs ml-1">×{item.quantity}</span>
          )}
        </TableCell>
        <TableCell className="text-right font-mono font-medium">
          {formatCurrency(itemTotal)}
          {item.includes_tax && (
            <span className="text-muted-foreground text-xs block">incl. tax</span>
          )}
        </TableCell>
        <TableCell>
          {item.lead_time_days && (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {item.lead_time_days}d
            </div>
          )}
        </TableCell>
        <TableCell>{getStatusBadge(item.status)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => { setEditingItem(item); setModalOpen(true); }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <ShoppingCart className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cart Total</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(totals.cartTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ordered/Received</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(totals.orderedTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items Tracked</p>
                <p className="text-xl font-bold">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Discount Alert */}
      {bulkEligibleItems.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Pro Desk Opportunity</p>
                <p className="text-xs text-muted-foreground">
                  {bulkEligibleItems.length} Home Depot item(s) over $1,500 may qualify for Bid Room or VPP pricing at Fort Worth Pro Desk.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost-to-Complete by Category */}
      {categories.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cost-to-Complete by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories
                .filter(cat => totals.byCategoryId[cat.id]?.procured > 0 || cat.actualSpent > 0)
                .slice(0, 5)
                .map(cat => {
                  const data = totals.byCategoryId[cat.id];
                  const totalProjected = data.spent + data.procured;
                  const remaining = data.budget - totalProjected;
                  const percentUsed = data.budget > 0 ? (totalProjected / data.budget) * 100 : 0;
                  const isOver = remaining < 0;
                  
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{getCategoryName(cat.id)}</span>
                        <span className={cn("font-mono text-xs", isOver ? "text-destructive" : "text-muted-foreground")}>
                          {formatCurrency(totalProjected)} / {formatCurrency(data.budget)}
                          {isOver && <span className="ml-1">(+{formatCurrency(Math.abs(remaining))} over)</span>}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentUsed, 100)} 
                        className={cn("h-2", isOver ? "[&>div]:bg-destructive" : "[&>div]:bg-primary")}
                      />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search items or model #..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPhase} onValueChange={setFilterPhase}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {PHASES.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {uniqueFinishes.length > 0 && (
          <Select value={filterFinish} onValueChange={setFilterFinish}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Finish" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Finishes</SelectItem>
              {uniqueFinishes.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Toggle view */}
      <div className="flex items-center gap-2">
        <Switch 
          id="phase-view" 
          checked={showByPhase} 
          onCheckedChange={setShowByPhase}
        />
        <Label htmlFor="phase-view" className="text-sm cursor-pointer">
          Group by Phase (Order of Operations)
        </Label>
      </div>

      {/* Items Table or By Phase */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No procurement items yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Start adding items from Amazon or Home Depot to track your materials
            </p>
            <Button onClick={() => { setEditingItem(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : showByPhase ? (
        <div className="space-y-4">
          {PHASES.map(phase => {
            const phaseItems = itemsByPhase[phase.value] || [];
            if (phaseItems.length === 0) return null;
            const isExpanded = expandedPhases.has(phase.value);
            const phaseTotal = phaseItems.reduce((sum, item) => 
              sum + item.unit_price * item.quantity * (item.includes_tax ? 1 + item.tax_rate : 1), 0
            );
            
            return (
              <Collapsible key={phase.value} open={isExpanded} onOpenChange={() => togglePhase(phase.value)}>
                <Card className="glass-card">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <CardTitle className="text-base">{phase.label}</CardTitle>
                          <Badge variant="outline" className="text-xs">{phaseItems.length} items</Badge>
                        </div>
                        <span className="font-mono font-medium">{formatCurrency(phaseTotal)}</span>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Finish</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Lead Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {phaseItems.map(renderItemRow)}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Finish</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Lead Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(renderItemRow)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <ProcurementItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        categories={categories}
        editingItem={editingItem}
        onSaved={() => { fetchItems(); setModalOpen(false); setEditingItem(null); }}
      />
    </div>
  );
}

// Modal Component
interface ProcurementItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  categories: CategoryBudget[];
  editingItem: ProcurementItem | null;
  onSaved: () => void;
}

function ProcurementItemModal({ open, onOpenChange, projectId, categories, editingItem, onSaved }: ProcurementItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    source_url: string;
    source_store: SourceStore;
    model_number: string;
    finish: string;
    unit_price: number;
    quantity: number;
    includes_tax: boolean;
    tax_rate: number;
    phase: Phase;
    lead_time_days: number | null;
    status: ItemStatus;
    category_id: string;
    bulk_discount_eligible: boolean;
    notes: string;
  }>({
    name: '',
    source_url: '',
    source_store: 'home_depot',
    model_number: '',
    finish: '',
    unit_price: 0,
    quantity: 1,
    includes_tax: true,
    tax_rate: TEXAS_TAX_RATE,
    phase: 'rough_in',
    lead_time_days: null,
    status: 'researching',
    category_id: '',
    bulk_discount_eligible: false,
    notes: '',
  });

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        source_url: editingItem.source_url || '',
        source_store: editingItem.source_store || 'home_depot',
        model_number: editingItem.model_number || '',
        finish: editingItem.finish || '',
        unit_price: editingItem.unit_price,
        quantity: editingItem.quantity,
        includes_tax: editingItem.includes_tax,
        tax_rate: editingItem.tax_rate,
        phase: editingItem.phase,
        lead_time_days: editingItem.lead_time_days,
        status: editingItem.status,
        category_id: editingItem.category_id || '',
        bulk_discount_eligible: editingItem.bulk_discount_eligible,
        notes: editingItem.notes || '',
      });
    } else {
      setForm({
        name: '',
        source_url: '',
        source_store: 'home_depot',
        model_number: '',
        finish: '',
        unit_price: 0,
        quantity: 1,
        includes_tax: true,
        tax_rate: TEXAS_TAX_RATE,
        phase: 'rough_in',
        lead_time_days: null,
        status: 'researching',
        category_id: '',
        bulk_discount_eligible: false,
        notes: '',
      });
    }
  }, [editingItem, open]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      project_id: projectId,
      user_id: user?.id,
      name: form.name.trim(),
      source_url: form.source_url || null,
      source_store: form.source_store,
      model_number: form.model_number || null,
      finish: form.finish || null,
      unit_price: form.unit_price,
      quantity: form.quantity,
      includes_tax: form.includes_tax,
      tax_rate: form.tax_rate,
      phase: form.phase,
      lead_time_days: form.lead_time_days,
      status: form.status,
      category_id: form.category_id || null,
      bulk_discount_eligible: form.bulk_discount_eligible,
      notes: form.notes || null,
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase.from('procurement_items').update(payload).eq('id', editingItem.id));
    } else {
      ({ error } = await supabase.from('procurement_items').insert(payload));
    }

    setLoading(false);

    if (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } else {
      toast.success(editingItem ? 'Item updated' : 'Item added');
      onSaved();
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return '';
    const budgetCat = BUDGET_CATEGORIES.find(bc => bc.value === cat.category);
    return budgetCat?.label || cat.category;
  };

  const subtotal = form.unit_price * form.quantity;
  const taxAmount = form.includes_tax ? subtotal * form.tax_rate : 0;
  const total = subtotal + taxAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Item' : 'Add Procurement Item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Name & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="LVP Flooring - Oak"
              />
            </div>
            <div className="space-y-2">
              <Label>Model / SKU #</Label>
              <Input 
                value={form.model_number} 
                onChange={(e) => setForm(f => ({ ...f, model_number: e.target.value }))}
                placeholder="SKU-12345"
              />
            </div>
          </div>

          {/* URL & Store */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Source URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={form.source_url} 
                  onChange={(e) => setForm(f => ({ ...f, source_url: e.target.value }))}
                  placeholder="https://homedepot.com/..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Store</Label>
              <Select value={form.source_store} onValueChange={(v: any) => setForm(f => ({ ...f, source_store: v }))}>
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
          </div>

          {/* Category & Finish */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Budget Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{getCategoryName(cat.id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Finish / Color</Label>
              <Input 
                value={form.finish} 
                onChange={(e) => setForm(f => ({ ...f, finish: e.target.value }))}
                placeholder="Matte Black"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unit Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  step="0.01"
                  value={form.unit_price} 
                  onChange={(e) => setForm(f => ({ ...f, unit_price: parseFloat(e.target.value) || 0 }))}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                type="number" 
                min="1"
                value={form.quantity} 
                onChange={(e) => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Lead Time (days)</Label>
              <Input 
                type="number" 
                min="0"
                value={form.lead_time_days ?? ''} 
                onChange={(e) => setForm(f => ({ ...f, lead_time_days: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="7"
              />
            </div>
          </div>

          {/* Tax Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Switch 
                checked={form.includes_tax} 
                onCheckedChange={(v) => setForm(f => ({ ...f, includes_tax: v }))}
              />
              <Label className="cursor-pointer">Include TX Sales Tax (8.25%)</Label>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Subtotal: ${subtotal.toFixed(2)}</p>
              {form.includes_tax && <p className="text-muted-foreground">Tax: ${taxAmount.toFixed(2)}</p>}
              <p className="font-medium">Total: ${total.toFixed(2)}</p>
            </div>
          </div>

          {/* Phase & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phase (When Needed)</Label>
              <Select value={form.phase} onValueChange={(v: any) => setForm(f => ({ ...f, phase: v }))}>
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
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm(f => ({ ...f, status: v }))}>
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
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={form.notes} 
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
