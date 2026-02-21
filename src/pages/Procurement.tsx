import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  ArrowUpDown,
  ExternalLink,
  Package,
  Truck,
  CheckCircle2,
  Pencil,
  Trash2,
  FolderOpen,
  Layers,
  Check,
  X,
  ShoppingBag,
  Bell,
} from 'lucide-react';
import { SubmitOrderModal } from '@/components/procurement/SubmitOrderModal';
import { OrderRequestsPanel } from '@/components/procurement/OrderRequestsPanel';
import { useOrderRequests } from '@/hooks/useOrderRequests';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProcurementItemModal } from '@/components/procurement/ProcurementItemModal';
import { BundleModal } from '@/components/procurement/BundleModal';
import { useCustomStores } from '@/hooks/useCustomStores';

type ItemStatus = 'researching' | 'in_cart' | 'ordered' | 'delivered' | 'installed';
type Phase = 'demo' | 'rough_in' | 'drywall' | 'trim_out' | 'finish' | 'punch' | 'final';
type SourceStore = 'amazon' | 'home_depot' | 'lowes' | 'floor_decor' | 'build' | 'ferguson' | 'custom' | 'other' | string;

interface ProcurementItem {
  id: string;
  bundle_id: string | null;
  bundle_ids?: string[];
  category_id: string | null;
  category: string | null;
  name: string;
  source_url: string | null;
  source_store: SourceStore | null;
  model_number: string | null;
  unit_price: number;
  quantity: number;
  includes_tax: boolean;
  is_pack_price: boolean;
  tax_rate: number;
  lead_time_days: number | null;
  phase: Phase | null;
  status: ItemStatus | null;
  finish: string | null;
  notes: string | null;
  bulk_discount_eligible: boolean | null;
  image_url: string | null;
}

interface ItemBundleAssignment {
  item_id: string;
  bundle_id: string;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
}

interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
}

const PHASES: { value: Phase; label: string }[] = [
  { value: 'demo', label: 'Demo' },
  { value: 'rough_in', label: 'Rough-In' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'trim_out', label: 'Trim Out' },
  { value: 'finish', label: 'Finish' },
  { value: 'punch', label: 'Punch List' },
  { value: 'final', label: 'Final' },
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
  { value: 'ferguson', label: 'Ferguson' },
  { value: 'custom', label: 'Custom' },
  { value: 'other', label: 'Other' },
];

const TEXAS_TAX_RATE = 0.0825;

export default function Procurement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stores } = useCustomStores();
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemProjectMap, setItemProjectMap] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBundle, setFilterBundle] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name_asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcurementItem | null>(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitOrderOpen, setSubmitOrderOpen] = useState(false);
  const [ordersPanelOpen, setOrdersPanelOpen] = useState(false);
  const { isOwner, isManager, pendingCount } = useOrderRequests();
  const fetchData = async () => {
    if (!user) return;
    
    const [itemsResult, bundlesResult, projectsResult, assignmentsResult, projectItemsResult] = await Promise.all([
      supabase
        .from('procurement_items')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('procurement_bundles')
        .select('*')
        .order('name'),
      supabase
        .from('projects')
        .select('id, name, address, status')
        .order('name'),
      supabase
        .from('procurement_item_bundles')
        .select('item_id, bundle_id'),
      supabase
        .from('project_procurement_items')
        .select('item_id, project_id')
    ]);

    // Create a map of item_id to bundle_ids
    const bundleMap: Record<string, string[]> = {};
    if (assignmentsResult.data) {
      assignmentsResult.data.forEach((a: ItemBundleAssignment) => {
        if (!bundleMap[a.item_id]) bundleMap[a.item_id] = [];
        bundleMap[a.item_id].push(a.bundle_id);
      });
    }

    if (itemsResult.data) {
      // Enrich items with their bundle_ids array
      const enrichedItems = itemsResult.data.map(item => ({
        ...item,
        bundle_ids: bundleMap[item.id] || []
      })) as ProcurementItem[];
      setItems(enrichedItems);
    }
    if (bundlesResult.data) {
      setBundles(bundlesResult.data as Bundle[]);
    }
    if (projectsResult.data) {
      setProjects(projectsResult.data);
    }
    // Build item -> project[] map
    const ipMap: Record<string, string[]> = {};
    if (projectItemsResult.data) {
      projectItemsResult.data.forEach((r: { item_id: string; project_id: string }) => {
        if (!ipMap[r.item_id]) ipMap[r.item_id] = [];
        ipMap[r.item_id].push(r.project_id);
      });
    }
    setItemProjectMap(ipMap);
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

  const getCategoryLabel = (category: string | null) => {
    if (!category) return null;
    const categoryMap: Record<string, string> = {
      'appliances': 'Appliances',
      'bathroom': 'Bathroom',
      'cabinets': 'Cabinets',
      'countertops': 'Countertops',
      'doors': 'Doors',
      'drywall': 'Drywall',
      'electrical': 'Electrical',
      'exterior_finishes': 'Exterior Finishes',
      'fencing': 'Fencing',
      'flooring': 'Flooring',
      'framing': 'Framing',
      'hardware': 'Hardware',
      'hvac': 'HVAC',
      'insulation': 'Insulation',
      'landscaping': 'Landscaping',
      'lighting': 'Light Fixtures',
      'paint': 'Paint',
      'plumbing': 'Plumbing',
      'pool': 'Pool',
      'roofing': 'Roofing',
      'tile': 'Tile',
      'trim': 'Trim',
      'windows': 'Windows',
      'other': 'Other',
    };
    return categoryMap[category] || category;
  };

  const calculateItemTotal = (item: ProcurementItem) => {
    // If pack price, don't multiply by quantity
    const subtotal = item.is_pack_price ? item.unit_price : item.unit_price * item.quantity;
    const tax = item.includes_tax ? 0 : subtotal * item.tax_rate;
    return subtotal + tax;
  };

  // Get unique categories for filter dropdown (sorted alphabetically)
  const uniqueCategories = [...new Set(items.map(i => i.category).filter(Boolean))]
    .sort((a, b) => (getCategoryLabel(a) || '').localeCompare(getCategoryLabel(b) || ''));

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const bundleIds = item.bundle_ids || [];
    const matchesBundle = filterBundle === 'all' || 
      (filterBundle === 'unassigned' ? bundleIds.length === 0 : bundleIds.includes(filterBundle));
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesBundle && matchesCategory;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'price_low':
        return a.unit_price - b.unit_price;
      case 'price_high':
        return b.unit_price - a.unit_price;
      default:
        return 0;
    }
  });

  // Summary stats
  const totalItems = filteredItems.length;
  const unassignedCount = filteredItems.filter(i => !i.bundle_ids || i.bundle_ids.length === 0).length;

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

  const activeProjects = projects.filter(p => p.status !== 'complete');

  const allVisibleSelected = sortedItems.length > 0 && sortedItems.every(item => selectedIds.has(item.id));
  const someVisibleSelected = sortedItems.some(item => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map(item => item.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssignToProject = async (itemId: string, projectId: string, projectName: string) => {
    const { error } = await supabase
      .from('project_procurement_items')
      .insert({ item_id: itemId, project_id: projectId, quantity: 1 });

    if (error) {
      if (error.code === '23505') {
        toast.info(`Already assigned to ${projectName}`);
      } else {
        toast.error('Failed to assign item');
      }
    } else {
      toast.success(`Added to ${projectName}`);
      fetchData();
    }
  };

  const handleBulkAssign = async (projectId: string, projectName: string) => {
    const ids = Array.from(selectedIds);
    let added = 0;
    let skipped = 0;

    for (const itemId of ids) {
      const alreadyAssigned = (itemProjectMap[itemId] || []).includes(projectId);
      if (alreadyAssigned) { skipped++; continue; }

      const { error } = await supabase
        .from('project_procurement_items')
        .insert({ item_id: itemId, project_id: projectId, quantity: 1 });

      if (error) {
        if (error.code === '23505') skipped++;
        else toast.error(`Failed to assign item`);
      } else {
        added++;
      }
    }

    if (added > 0) toast.success(`Added ${added} item${added > 1 ? 's' : ''} to ${projectName}`);
    if (skipped > 0) toast.info(`${skipped} item${skipped > 1 ? 's' : ''} already assigned`);
    setSelectedIds(new Set());
    fetchData();
  };

  const getStatusBadge = (status: ItemStatus | null) => {
    const effectiveStatus = status || 'researching';
    const statusInfo = STATUSES.find(s => s.value === effectiveStatus);
    if (!statusInfo) return null;
    const Icon = statusInfo.icon;
    return (
      <Badge variant="outline" className={cn('gap-1', statusInfo.color)}>
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getBundleNames = (bundleIds: string[] | undefined) => {
    if (!bundleIds || bundleIds.length === 0) return ['Unassigned'];
    return bundleIds.map(id => {
      const bundle = bundles.find(b => b.id === id);
      return bundle?.name || 'Unknown';
    });
  };

  const getBundleProjectNames = (bundleIds: string[] | undefined) => {
    if (!bundleIds || bundleIds.length === 0) return [];
    const projectNames = bundleIds
      .map(id => {
        const bundle = bundles.find(b => b.id === id);
        if (!bundle?.project_id) return null;
        const project = projects.find(p => p.id === bundle.project_id);
        return project?.name;
      })
      .filter((name): name is string => name !== null);
    return [...new Set(projectNames)]; // Remove duplicates
  };

  const handleDeleteBundle = async (id: string) => {
    const { error } = await supabase
      .from('procurement_bundles')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete bundle');
    } else {
      toast.success('Bundle deleted');
      fetchData();
    }
  };

  return (
    <TooltipProvider>
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Procurement
            </h1>
            <p className="text-muted-foreground">Manage materials and product specifications across all projects</p>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Button
                variant="outline"
                className="relative px-2 sm:px-4"
                onClick={() => setOrdersPanelOpen(true)}
              >
                <Bell className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Orders</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {pendingCount}
                  </span>
                )}
              </Button>
            )}
            <Button variant="outline" className="px-2 sm:px-4" onClick={() => { setEditingBundle(null); setBundleModalOpen(true); }}>
              <FolderOpen className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Bundle</span>
            </Button>
            <Button className="px-2 sm:px-4" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Item</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Items</span>
              </div>
              <p className="text-2xl font-bold">{totalItems}</p>
            </CardContent>
          </Card>
          
          <Card 
            className="glass-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/bundles')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Bundles</span>
              </div>
              <p className="text-2xl font-bold">{bundles.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Items Table with Filters */}
        <Card className="glass-card">
          <CardContent className="pt-4">
            {/* Filters Row */}
            <div className="flex flex-col gap-2 mb-6">
              {/* Row 1: Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items, model numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Row 2: Dropdowns side-by-side on mobile, inline on md+ */}
              <div className="grid grid-cols-3 gap-2">
                <Select value={filterBundle} onValueChange={setFilterBundle}>
                  <SelectTrigger className="h-9 min-w-0 md:w-48 md:flex-none text-xs sm:text-sm">
                    <SelectValue placeholder="Bundle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bundles</SelectItem>
                    {bundles.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9 min-w-0 md:w-48 md:flex-none text-xs sm:text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map(cat => (
                      <SelectItem key={cat} value={cat!}>{getCategoryLabel(cat)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 min-w-0 md:w-48 md:flex-none text-xs sm:text-sm">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">A-Z</SelectItem>
                    <SelectItem value="name_desc">Z-A</SelectItem>
                    <SelectItem value="price_low">Price ↑</SelectItem>
                    <SelectItem value="price_high">Price ↓</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-muted-foreground">Items</span>
              <Badge variant="secondary" className="text-xs">{filteredItems.length}</Badge>
            </div>
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
                      <TableHead className="w-8 sm:w-10 text-center px-1 sm:px-4">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                          className={someVisibleSelected && !allVisibleSelected ? 'opacity-50' : ''}
                        />
                      </TableHead>
                      <TableHead className="w-10 sm:w-16 text-center px-1 sm:px-4"></TableHead>
                      <TableHead className="px-2 sm:px-4">Item</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">Bundle</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">Source</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">Category</TableHead>
                      <TableHead className="text-right px-2 sm:px-4">Price</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">Qty</TableHead>
                      <TableHead className="text-center px-1 sm:px-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item) => (
                      <TableRow key={item.id} data-state={selectedIds.has(item.id) ? 'selected' : undefined}>
                        <TableCell className="text-center px-1 sm:px-4">
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleSelectItem(item.id)}
                            aria-label={`Select ${item.name}`}
                          />
                        </TableCell>
                         <TableCell className="text-center p-1 sm:p-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center mx-auto">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 max-w-[120px] sm:max-w-none">
                          <p className="font-medium line-clamp-2 text-sm leading-tight">{item.name}</p>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          {(!item.bundle_ids || item.bundle_ids.length === 0) ? (
                            <span className="text-sm text-muted-foreground italic">Unassigned</span>
                          ) : item.bundle_ids.length === 1 ? (
                            <div>
                              <span className="text-sm">{getBundleNames(item.bundle_ids)[0]}</span>
                              {getBundleProjectNames(item.bundle_ids).length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  → {getBundleProjectNames(item.bundle_ids).join(', ')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary">Multiple</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {getBundleNames(item.bundle_ids).map((name, idx) => (
                                  <p key={idx}>{name}</p>
                                ))}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm">
                              {stores.find(s => s.value === item.source_store)?.label || item.source_store || '-'}
                            </span>
                            {item.source_url && (
                              <a 
                                href={item.source_url.startsWith('http://') || item.source_url.startsWith('https://') ? item.source_url : `https://${item.source_url}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          {getCategoryLabel(item.category) ? (
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryLabel(item.category)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono px-2 sm:px-4 whitespace-nowrap">
                          <div>
                            <span className="text-sm">{formatCurrency(item.unit_price)}</span>
                            <span className="text-xs text-muted-foreground block sm:hidden">×{item.quantity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">{item.quantity}</TableCell>
                        <TableCell className="text-center p-1 sm:p-4">
                          <div className="flex items-center justify-center gap-0">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 sm:h-8 sm:w-8"
                              onClick={() => { setEditingItem(item); setModalOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 text-primary">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-2" align="end">
                                <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Assign to Project</p>
                                <div className="max-h-48 overflow-y-auto space-y-0.5">
                                  {activeProjects.length === 0 ? (
                                    <p className="text-sm text-muted-foreground px-2 py-1">No active projects</p>
                                  ) : (
                                    activeProjects.map(project => {
                                      const isAssigned = (itemProjectMap[item.id] || []).includes(project.id);
                                      return (
                                        <button
                                          key={project.id}
                                          className={cn(
                                            "w-full text-left text-sm px-2 py-1.5 rounded-md flex items-center justify-between",
                                            isAssigned 
                                              ? "text-muted-foreground cursor-default" 
                                              : "hover:bg-accent cursor-pointer"
                                          )}
                                          disabled={isAssigned}
                                          onClick={() => handleAssignToProject(item.id, project.id, project.name)}
                                        >
                                          <span className="truncate">{project.name}</span>
                                          {isAssigned && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hidden sm:inline-flex"
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

      {/* Bulk Selection Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 flex-wrap justify-center">
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Assign to Project
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="center" side="top">
              <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Assign to Project</p>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {activeProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2 py-1">No active projects</p>
                ) : (
                  activeProjects.map(project => (
                    <button
                      key={project.id}
                      className="w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => handleBulkAssign(project.id, project.name)}
                    >
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          {isManager && (
            <Button size="sm" onClick={() => setSubmitOrderOpen(true)}>
              <ShoppingBag className="h-4 w-4 mr-1" />
              Request Order
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <ProcurementItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={editingItem}
        bundles={bundles}
        onSave={fetchData}
      />

      {/* Bundle Modal */}
      <BundleModal
        open={bundleModalOpen}
        onOpenChange={setBundleModalOpen}
        bundle={editingBundle}
        projects={projects}
        onSave={fetchData}
      />

      {/* Submit Order Modal (PM) */}
      <SubmitOrderModal
        open={submitOrderOpen}
        onOpenChange={setSubmitOrderOpen}
        selectedItems={sortedItems
          .filter(item => selectedIds.has(item.id))
          .map(item => ({
            id: item.id,
            name: item.name,
            unit_price: item.unit_price,
            quantity: item.quantity,
            image_url: item.image_url,
            source_url: item.source_url,
            source_store: item.source_store,
          }))}
        onSuccess={() => setSelectedIds(new Set())}
      />

      {/* Order Requests Panel (Owner) */}
      {isOwner && (
        <OrderRequestsPanel open={ordersPanelOpen} onOpenChange={setOrdersPanelOpen} />
      )}
    </MainLayout>
    </TooltipProvider>
  );
}