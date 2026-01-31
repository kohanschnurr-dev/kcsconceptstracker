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
  Library,
  Check,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BUDGET_CATEGORIES } from '@/types';

// Types
type SourceStore = 'amazon' | 'home_depot' | 'lowes' | 'floor_decor' | 'build' | 'ferguson' | 'other';
type Phase = 'demo' | 'rough_in' | 'drywall' | 'trim_out' | 'final';
type ItemStatus = 'researching' | 'in_cart' | 'ordered' | 'shipped' | 'on_site' | 'installed';

interface ProcurementItem {
  id: string;
  project_id: string | null;
  category_id: string | null;
  name: string;
  source_url: string | null;
  source_store: SourceStore | null;
  model_number: string | null;
  finish: string | null;
  unit_price: number;
  quantity: number;
  includes_tax: boolean;
  is_pack_price: boolean;
  tax_rate: number;
  phase: Phase | null;
  lead_time_days: number | null;
  status: ItemStatus | null;
  bulk_discount_eligible: boolean;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  // For project-specific tracking
  project_quantity?: number;
}

interface ProjectItemAssignment {
  id: string;
  project_id: string;
  item_id: string;
  quantity: number;
  status: ItemStatus | null;
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
  { value: 'floor_decor', label: 'Floor & Decor' },
  { value: 'build', label: 'Build.com' },
  { value: 'ferguson', label: 'Ferguson' },
  { value: 'other', label: 'Other' },
];

export function ProcurementTab({ projectId, categories, currency = '$' }: ProcurementTabProps) {
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [assignments, setAssignments] = useState<ProjectItemAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  
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
    
    // Fetch project item assignments
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('project_procurement_items')
      .select('*')
      .eq('project_id', projectId);

    if (assignmentError) {
      console.error('Error fetching project items:', assignmentError);
      setAssignments([]);
      setItems([]);
      setLoading(false);
      return;
    }

    const assignments = (assignmentData || []) as unknown as ProjectItemAssignment[];
    setAssignments(assignments);

    if (assignments.length > 0) {
      const itemIds = assignments.map(a => a.item_id);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('procurement_items')
        .select('*')
        .in('id', itemIds);

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        setItems([]);
      } else {
        // Merge assignment data (quantity, status) into items
        const enrichedItems = (itemsData || []).map(item => {
          const assignment = assignments.find(a => a.item_id === item.id);
          return {
            ...item,
            project_quantity: assignment?.quantity || 1,
            status: (assignment?.status || item.status) as ItemStatus | null,
          } as ProcurementItem;
        });
        setItems(enrichedItems);
      }
    } else {
      setItems([]);
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
      if (item.phase && grouped[item.phase]) {
        grouped[item.phase].push(item);
      } else {
        // Items without phase go to rough_in by default
        grouped['rough_in'].push(item);
      }
    });
    return grouped;
  }, [filteredItems]);

  // Calculate totals
  const totals = useMemo(() => {
    const calculateItemTotal = (item: ProcurementItem) => {
      const qty = item.project_quantity || item.quantity || 1;
      const subtotal = item.is_pack_price ? item.unit_price : item.unit_price * qty;
      return item.includes_tax ? subtotal : subtotal * (1 + item.tax_rate);
    };

    const cartTotal = filteredItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const orderedTotal = filteredItems
      .filter(i => ['ordered', 'shipped', 'on_site', 'installed'].includes(i.status || ''))
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
      (i.unit_price * (i.project_quantity || i.quantity)) >= 1500
    );
  }, [filteredItems]);

  const handleRemoveFromProject = async (itemId: string) => {
    const { error } = await supabase
      .from('project_procurement_items')
      .delete()
      .eq('project_id', projectId)
      .eq('item_id', itemId);

    if (error) {
      toast.error('Failed to remove item');
    } else {
      toast.success('Item removed from project');
      fetchItems();
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    const { error } = await supabase
      .from('project_procurement_items')
      .update({ quantity: newQuantity })
      .eq('project_id', projectId)
      .eq('item_id', itemId);

    if (error) {
      toast.error('Failed to update quantity');
    } else {
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, project_quantity: newQuantity } : item
      ));
    }
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    const { error } = await supabase
      .from('project_procurement_items')
      .update({ status: newStatus })
      .eq('project_id', projectId)
      .eq('item_id', itemId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus as ItemStatus } : item
      ));
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

  const getStatusBadge = (status: string | null) => {
    const s = STATUSES.find(st => st.value === (status || 'researching'));
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
    const qty = item.project_quantity || item.quantity || 1;
    const itemTotal = item.is_pack_price 
      ? item.unit_price * (item.includes_tax ? 1 : 1 + item.tax_rate)
      : item.unit_price * qty * (item.includes_tax ? 1 : 1 + item.tax_rate);
    
    return (
      <TableRow 
        key={item.id} 
        className={cn("group hover:bg-muted/50", item.source_url && "cursor-pointer")}
        onClick={() => {
          if (item.source_url) {
            window.open(item.source_url, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <TableCell>
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </TableCell>
        <TableCell className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium truncate">{item.name}</p>
            {item.model_number && (
              <p className="text-xs text-muted-foreground">#{item.model_number}</p>
            )}
            {item.source_url && (
              <span className="text-xs text-primary inline-flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {STORES.find(s => s.value === item.source_store)?.label || 'Link'}
              </span>
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
        </TableCell>
        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
          <Input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
            className="w-16 h-8 text-right text-sm"
          />
        </TableCell>
        <TableCell className="text-right font-mono font-medium">
          {formatCurrency(itemTotal)}
        </TableCell>
        <TableCell onClick={e => e.stopPropagation()}>
          <Select 
            value={item.status || 'researching'} 
            onValueChange={(v) => handleUpdateStatus(item.id, v)}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFromProject(item.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
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
                <p className="text-sm text-muted-foreground">Items Assigned</p>
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
                  {bulkEligibleItems.length} Home Depot item(s) over $1,500 may qualify for Bid Room or VPP pricing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost-to-Complete by Category */}
      {categories.length > 0 && items.length > 0 && (
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
        <Button onClick={() => setPickerOpen(true)}>
          <Library className="h-4 w-4 mr-2" />
          Add from Library
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
            <p className="text-muted-foreground mb-2">No procurement items assigned</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add items from your procurement library to this project
            </p>
            <Button onClick={() => setPickerOpen(true)}>
              <Library className="h-4 w-4 mr-2" />
              Add from Library
            </Button>
          </CardContent>
        </Card>
      ) : showByPhase ? (
        <div className="space-y-4">
          {PHASES.map(phase => {
            const phaseItems = itemsByPhase[phase.value] || [];
            if (phaseItems.length === 0) return null;
            const isExpanded = expandedPhases.has(phase.value);
            const phaseTotal = phaseItems.reduce((sum, item) => {
              const qty = item.project_quantity || item.quantity || 1;
              return sum + (item.is_pack_price ? item.unit_price : item.unit_price * qty) * (item.includes_tax ? 1 : 1 + item.tax_rate);
            }, 0);
            
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
                            <TableHead className="w-16"></TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Finish</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Total</TableHead>
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
                  <TableHead className="w-16"></TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Finish</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
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

      {/* Item Picker Modal */}
      <ItemPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        projectId={projectId}
        existingItemIds={items.map(i => i.id)}
        onItemsAdded={fetchItems}
      />
    </div>
  );
}

// Item Picker Modal - Select items from library
interface ItemPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingItemIds: string[];
  onItemsAdded: () => void;
}

interface Bundle {
  id: string;
  name: string;
}

function ItemPickerModal({ open, onOpenChange, projectId, existingItemIds, onItemsAdded }: ItemPickerModalProps) {
  const [allItems, setAllItems] = useState<ProcurementItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Bundle filtering state
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [filterBundleId, setFilterBundleId] = useState<string>('all');
  const [itemBundleMap, setItemBundleMap] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (open) {
      fetchAllItems();
      setSelectedIds(new Set());
      setSearchQuery('');
      setFilterBundleId('all');
    }
  }, [open]);

  const fetchAllItems = async () => {
    setLoading(true);
    
    // Fetch items, bundles, and bundle assignments in parallel
    const [itemsRes, bundlesRes, assignmentsRes] = await Promise.all([
      supabase.from('procurement_items').select('*').order('name'),
      supabase.from('procurement_bundles').select('id, name').order('name'),
      supabase.from('procurement_item_bundles').select('item_id, bundle_id'),
    ]);

    if (itemsRes.error) {
      console.error('Error fetching items:', itemsRes.error);
      toast.error('Failed to load items');
    } else {
      setAllItems((itemsRes.data || []) as ProcurementItem[]);
    }

    if (bundlesRes.error) {
      console.error('Error fetching bundles:', bundlesRes.error);
    } else {
      setBundles((bundlesRes.data || []) as Bundle[]);
    }

    // Build item -> bundle_ids map
    if (assignmentsRes.data) {
      const map = new Map<string, string[]>();
      assignmentsRes.data.forEach(({ item_id, bundle_id }) => {
        const existing = map.get(item_id) || [];
        existing.push(bundle_id);
        map.set(item_id, existing);
      });
      setItemBundleMap(map);
    }

    setLoading(false);
  };

  const availableItems = useMemo(() => {
    return allItems.filter(item => {
      // Exclude items already in project
      if (existingItemIds.includes(item.id)) return false;
      
      // Filter by bundle
      if (filterBundleId !== 'all') {
        const itemBundles = itemBundleMap.get(item.id) || [];
        if (!itemBundles.includes(filterBundleId)) return false;
      }
      
      // Filter by search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) ||
          item.model_number?.toLowerCase().includes(q) ||
          item.finish?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allItems, existingItemIds, searchQuery, filterBundleId, itemBundleMap]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const availableIds = availableItems.map(item => item.id);
    setSelectedIds(new Set(availableIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;

    setSaving(true);
    
    const insertData = Array.from(selectedIds).map(itemId => ({
      project_id: projectId,
      item_id: itemId,
      quantity: 1,
      status: 'researching',
    }));

    const { error } = await supabase
      .from('project_procurement_items')
      .insert(insertData);

    setSaving(false);

    if (error) {
      console.error('Error adding items:', error);
      toast.error('Failed to add items');
    } else {
      toast.success(`Added ${selectedIds.size} item(s) to project`);
      onItemsAdded();
      onOpenChange(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            Add Items from Library
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, model number, or finish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bundle filter + Select All / Deselect All */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterBundleId} onValueChange={setFilterBundleId}>
            <SelectTrigger className="w-[180px]">
              <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Bundle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              {bundles.map(bundle => (
                <SelectItem key={bundle.id} value={bundle.id}>{bundle.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex-1" />
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
            disabled={availableItems.length === 0}
          >
            <Check className="h-4 w-4 mr-1" />
            Select All
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDeselectAll}
            disabled={selectedIds.size === 0}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : availableItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {allItems.length === 0 
                  ? "No items in library. Add items in the Procurement page first."
                  : searchQuery || filterBundleId !== 'all'
                    ? "No matching items found" 
                    : "All items already added to this project"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {availableItems.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedIds.has(item.id) && "bg-primary/10"
                  )}
                  onClick={() => toggleItem(item.id)}
                >
                  <Checkbox 
                    checked={selectedIds.has(item.id)} 
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.model_number && <span>#{item.model_number}</span>}
                      {item.finish && <Badge variant="secondary" className="text-xs">{item.finish}</Badge>}
                      {STORES.find(s => s.value === item.source_store) && (
                        <span>{STORES.find(s => s.value === item.source_store)?.label}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">{formatCurrency(item.unit_price)}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={selectedIds.size === 0 || saving}>
              {saving ? 'Adding...' : `Add ${selectedIds.size} Item${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
