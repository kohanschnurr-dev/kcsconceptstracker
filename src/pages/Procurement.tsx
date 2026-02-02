import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Layers
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProcurementItemModal } from '@/components/procurement/ProcurementItemModal';
import { BundleModal } from '@/components/procurement/BundleModal';

type ItemStatus = 'researching' | 'in_cart' | 'ordered' | 'delivered' | 'installed';
type Phase = 'rough_in' | 'trim_out' | 'finish' | 'punch';
type SourceStore = 'amazon' | 'home_depot' | 'lowes' | 'floor_decor' | 'build' | 'ferguson' | 'other';

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
  { value: 'ferguson', label: 'Ferguson' },
  { value: 'other', label: 'Other' },
];

const TEXAS_TAX_RATE = 0.0825;

export default function Procurement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBundle, setFilterBundle] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name_asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcurementItem | null>(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  const fetchData = async () => {
    if (!user) return;
    
    const [itemsResult, bundlesResult, projectsResult, assignmentsResult] = await Promise.all([
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
        .select('id, name, address')
        .order('name'),
      supabase
        .from('procurement_item_bundles')
        .select('item_id, bundle_id')
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
            <Button variant="outline" onClick={() => { setEditingBundle(null); setBundleModalOpen(true); }}>
              <FolderOpen className="h-4 w-4 mr-2" />
              New Bundle
            </Button>
            <Button onClick={() => { setEditingItem(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
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
              <Select value={filterBundle} onValueChange={setFilterBundle}>
                <SelectTrigger className="w-full md:w-48">
                  <Layers className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Bundles" />
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
                <SelectTrigger className="w-full md:w-48">
                  <Package className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat!}>{getCategoryLabel(cat)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">A-Z</SelectItem>
                  <SelectItem value="name_desc">Z-A</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
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
                      <TableHead className="w-16 text-center"></TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Bundle</TableHead>
                      <TableHead className="text-center">Source</TableHead>
                      <TableHead className="text-center">Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center mx-auto">
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
                        <TableCell>
                          <p className="font-medium">{item.name}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div>
                            {getBundleNames(item.bundle_ids).map((name, idx) => (
                              <span 
                                key={idx} 
                                className={cn(
                                  "text-sm block",
                                  (!item.bundle_ids || item.bundle_ids.length === 0) && "text-muted-foreground italic"
                                )}
                              >
                                {name}
                              </span>
                            ))}
                            {getBundleProjectNames(item.bundle_ids).length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                → {getBundleProjectNames(item.bundle_ids).join(', ')}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
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
                        <TableCell className="text-center">
                          {getCategoryLabel(item.category) ? (
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryLabel(item.category)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
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
    </MainLayout>
  );
}