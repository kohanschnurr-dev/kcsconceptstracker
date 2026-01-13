import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  FolderOpen, 
  Package, 
  Plus, 
  Search,
  Pencil,
  Trash2,
  ImageIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BundleModal } from '@/components/procurement/BundleModal';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
  cover_image_url: string | null;
}

interface Project {
  id: string;
  name: string;
  address: string;
}

interface ProjectPhoto {
  project_id: string;
  file_path: string;
}

interface BundleWithDetails extends Bundle {
  itemCount: number;
  totalValue: number;
  projectName: string | null;
  coverPhoto: string | null;
}

export default function Bundles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bundles, setBundles] = useState<BundleWithDetails[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  const fetchData = async () => {
    if (!user) return;

    const [bundlesResult, itemsResult, projectsResult, photosResult] = await Promise.all([
      supabase
        .from('procurement_bundles')
        .select('*')
        .order('name'),
      supabase
        .from('procurement_items')
        .select('id, bundle_id, unit_price, quantity, includes_tax, tax_rate'),
      supabase
        .from('projects')
        .select('id, name, address')
        .order('name'),
      supabase
        .from('project_photos')
        .select('project_id, file_path')
        .order('created_at', { ascending: false })
    ]);

    const bundlesData = bundlesResult.data || [];
    const itemsData = itemsResult.data || [];
    const projectsData = projectsResult.data || [];
    const photosData = photosResult.data || [];

    setProjects(projectsData);

    // Create a map of project photos (first photo per project)
    const projectPhotoMap: Record<string, string> = {};
    photosData.forEach(photo => {
      if (!projectPhotoMap[photo.project_id]) {
        projectPhotoMap[photo.project_id] = photo.file_path;
      }
    });

    // Calculate bundle details
    const bundlesWithDetails: BundleWithDetails[] = bundlesData.map(bundle => {
      const bundleItems = itemsData.filter(item => item.bundle_id === bundle.id);
      const itemCount = bundleItems.length;
      const totalValue = bundleItems.reduce((sum, item) => {
        const subtotal = item.unit_price * item.quantity;
        const tax = item.includes_tax ? 0 : subtotal * (item.tax_rate || 0.0825);
        return sum + subtotal + tax;
      }, 0);

      const project = projectsData.find(p => p.id === bundle.project_id);
      // Prefer bundle's own cover image, fall back to project photo
      const coverPhoto = bundle.cover_image_url || (bundle.project_id ? projectPhotoMap[bundle.project_id] || null : null);

      return {
        ...bundle,
        itemCount,
        totalValue,
        projectName: project?.name || null,
        coverPhoto
      };
    });

    setBundles(bundlesWithDetails);
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

  const getPhotoUrl = (filePath: string) => {
    const { data } = supabase.storage.from('project-photos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleDeleteBundle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleEditBundle = (bundle: Bundle, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBundle(bundle);
    setBundleModalOpen(true);
  };

  const filteredBundles = bundles.filter(bundle =>
    bundle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bundle.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bundle.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/procurement')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="h-6 w-6 text-primary" />
                Bundles
              </h1>
              <p className="text-muted-foreground">Organize procurement items into bundles</p>
            </div>
          </div>
          <Button onClick={() => { setEditingBundle(null); setBundleModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Bundle
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bundles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bundles Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredBundles.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-1">No bundles yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create bundles to organize your procurement items</p>
              <Button onClick={() => { setEditingBundle(null); setBundleModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Bundle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBundles.map((bundle) => (
              <Card 
                key={bundle.id}
                className="glass-card cursor-pointer hover:border-primary/50 transition-all group overflow-hidden"
                onClick={() => navigate(`/bundles/${bundle.id}`)}
              >
                {/* Cover Photo */}
                {bundle.coverPhoto ? (
                  <div className="h-32 w-full overflow-hidden">
                    <img
                      src={bundle.coverPhoto.startsWith('http') ? bundle.coverPhoto : getPhotoUrl(bundle.coverPhoto)}
                      alt={bundle.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="h-32 w-full bg-muted/50 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{bundle.name}</h3>
                      {bundle.projectName ? (
                        <p className="text-sm text-muted-foreground truncate">→ {bundle.projectName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Not assigned</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleEditBundle(bundle, e)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteBundle(bundle.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {bundle.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{bundle.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{bundle.itemCount} items</span>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {formatCurrency(bundle.totalValue)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
