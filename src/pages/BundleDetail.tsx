import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  FolderOpen, 
  Package, 
  ExternalLink,
  ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Camera
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProcurementItemModal } from '@/components/procurement/ProcurementItemModal';

import { BundleModal } from '@/components/procurement/BundleModal';

type Phase = 'rough_in' | 'trim_out' | 'finish' | 'punch';
type SourceStore = 'amazon' | 'home_depot' | 'lowes' | 'floor_decor' | 'build' | 'ferguson' | 'other';
type ItemStatus = 'researching' | 'in_cart' | 'ordered' | 'delivered' | 'installed';

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

interface ProcurementItem {
  id: string;
  bundle_id: string | null;
  category_id: string | null;
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
  bundle_quantity?: number; // Quantity specific to this bundle
}

interface ProjectPhoto {
  id: string;
  project_id: string;
  file_path: string;
  caption: string | null;
  category: string | null;
}

const PHASES: { value: Phase; label: string }[] = [
  { value: 'rough_in', label: 'Rough-In' },
  { value: 'trim_out', label: 'Trim Out' },
  { value: 'finish', label: 'Finish' },
  { value: 'punch', label: 'Punch List' },
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

export default function BundleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allBundles, setAllBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcurementItem | null>(null);

  const fetchData = async () => {
    if (!user || !id) return;

    // Fetch bundle
    const { data: bundleData } = await supabase
      .from('procurement_bundles')
      .select('*')
      .eq('id', id)
      .single();

    if (bundleData) {
      setBundle(bundleData as Bundle);

      // Fetch associated project if any
      if (bundleData.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name, address')
          .eq('id', bundleData.project_id)
          .single();
        
        if (projectData) {
          setProject(projectData);

          // Fetch project photos
          const { data: photosData } = await supabase
            .from('project_photos')
            .select('*')
            .eq('project_id', bundleData.project_id)
            .order('created_at', { ascending: false });
          
          if (photosData) {
            setPhotos(photosData as ProjectPhoto[]);
          }
        }
      }
    }

    // Fetch items in this bundle using junction table with quantity
    const { data: bundleAssignments } = await supabase
      .from('procurement_item_bundles')
      .select('item_id, quantity')
      .eq('bundle_id', id);

    if (bundleAssignments && bundleAssignments.length > 0) {
      const itemIds = bundleAssignments.map(a => a.item_id);
      const { data: itemsData } = await supabase
        .from('procurement_items')
        .select('*')
        .in('id', itemIds)
        .order('created_at', { ascending: false });

      if (itemsData) {
        // Merge bundle-specific quantity into items
        const itemsWithBundleQty = itemsData.map(item => {
          const assignment = bundleAssignments.find(a => a.item_id === item.id);
          return {
            ...item,
            bundle_quantity: assignment?.quantity || 1,
          } as ProcurementItem;
        });
        setItems(itemsWithBundleQty);
      }
    } else {
      setItems([]);
    }

    // Fetch all projects for the modal
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name, address')
      .order('name');

    if (projectsData) {
      setAllProjects(projectsData);
    }

    // Fetch all bundles for item modal
    const { data: bundlesData } = await supabase
      .from('procurement_bundles')
      .select('*')
      .order('name');

    if (bundlesData) {
      setAllBundles(bundlesData as Bundle[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateItemTotal = (item: ProcurementItem) => {
    const qty = item.bundle_quantity || item.quantity || 1;
    // If pack price, don't multiply by quantity
    const subtotal = item.is_pack_price ? item.unit_price : item.unit_price * qty;
    const tax = item.includes_tax ? 0 : subtotal * item.tax_rate;
    return subtotal + tax;
  };

  const totalValue = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const handleUpdateBundleQuantity = async (itemId: string, newQuantity: number) => {
    if (!id) return;
    
    const { error } = await supabase
      .from('procurement_item_bundles')
      .update({ quantity: newQuantity })
      .eq('bundle_id', id)
      .eq('item_id', itemId);

    if (error) {
      toast.error('Failed to update quantity');
    } else {
      // Update local state
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, bundle_quantity: newQuantity } : item
      ));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('procurement_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to delete item');
    } else {
      toast.success('Item deleted');
      fetchData();
    }
  };

  const getPhotoUrl = (filePath: string) => {
    const { data } = supabase.storage.from('project-photos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    );
  }

  if (!bundle) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Bundle not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/procurement')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Procurement
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/bundles')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="h-6 w-6 text-primary" />
                {bundle.name}
              </h1>
              {project ? (
                <p className="text-muted-foreground">
                  Assigned to: <span className="text-foreground">{project.name}</span>
                </p>
              ) : (
                <p className="text-muted-foreground italic">Not assigned to a project</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBundleModalOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Bundle
            </Button>
            <Button onClick={() => { setEditingItem(null); setItemModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Items</span>
              </div>
              <p className="text-2xl font-bold">{items.length}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">Total Value</span>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(totalValue)}</p>
            </CardContent>
          </Card>

          {project && (
            <Card className="glass-card">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Camera className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Project Photos</span>
                </div>
                <p className="text-2xl font-bold">{photos.length}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Description */}
        {bundle.description && (
          <Card className="glass-card">
            <CardContent className="pt-4">
              <p className="text-muted-foreground">{bundle.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Project Photos Gallery */}
        {project && photos.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Project Photos - {project.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.slice(0, 8).map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img
                      src={getPhotoUrl(photo.file_path)}
                      alt={photo.caption || 'Project photo'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                        <p className="text-xs text-white truncate">{photo.caption}</p>
                      </div>
                    )}
                    {photo.category && (
                      <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                        {photo.category}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              {photos.length > 8 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  View All {photos.length} Photos
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty photos state when project exists but no photos */}
        {project && photos.length === 0 && (
          <Card className="glass-card border-dashed">
            <CardContent className="py-8 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No project photos yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add photos to the project to see them here
              </p>
              <Button variant="outline" onClick={() => navigate(`/projects/${project.id}`)}>
                Go to Project
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Items Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-1">No items in this bundle</h3>
                <p className="text-sm text-muted-foreground mb-4">Add items to start building this bundle</p>
                <Button onClick={() => { setEditingItem(null); setItemModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16"></TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow 
                        key={item.id} 
                        className={item.source_url ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/30"}
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
                        <TableCell>
                          <p className="font-medium">{item.name}</p>
                          {item.model_number && (
                            <p className="text-xs text-muted-foreground">SKU: {item.model_number}</p>
                          )}
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
                                onClick={(e) => e.stopPropagation()}
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
                        <TableCell>
                          {item.finish ? (
                            <Badge variant="secondary" className="text-xs">{item.finish}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={item.bundle_quantity || 1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              handleUpdateBundleQuantity(item.id, val);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 h-8 text-right text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(calculateItemTotal(item))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => { 
                                e.stopPropagation();
                                setEditingItem(item); 
                                setItemModalOpen(true); 
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
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

      <ProcurementItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        item={editingItem}
        bundles={allBundles}
        onSave={fetchData}
      />

      <BundleModal
        open={bundleModalOpen}
        onOpenChange={setBundleModalOpen}
        bundle={bundle}
        projects={allProjects}
        onSave={fetchData}
      />

    </MainLayout>
  );
}
