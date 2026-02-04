import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DollarSign, 
  ArrowLeft, 
  Link as LinkIcon,
  Loader2,
  DoorOpen,
  Droplets,
  Zap,
  Wind,
  Paintbrush,
  Hammer,
  Grid3X3,
  Lightbulb,
  Fence,
  Layers,
  Wrench,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Bath,
  Scissors,
  Waves,
  Archive,
  Refrigerator,
  AppWindow,
  Home,
  RectangleHorizontal,
  Square,
  LayoutDashboard,
  ChevronDown,
  TreePine,
  Sparkles,
  Upload,
  Package,
  X,
  Pencil,
  Camera,
  Settings,
  Plus,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCustomStores, DEFAULT_STORES } from '@/hooks/useCustomStores';

// Types
type ItemStatus = 'researching' | 'in_cart' | 'ordered' | 'delivered' | 'installed';
type Phase = 'rough_in' | 'trim_out' | 'finish' | 'punch';
type SourceStore = string;

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
  tax_rate: number;
  lead_time_days: number | null;
  phase: Phase | null;
  status: ItemStatus | null;
  finish: string | null;
  notes: string | null;
  bulk_discount_eligible: boolean | null;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
}

// Procurement categories with icons and specific fields
export type ProcurementCategory = 
  | 'doors'
  | 'flooring'
  | 'plumbing'
  | 'electrical'
  | 'exterior_finishes'
  | 'hvac'
  | 'paint'
  | 'cabinets'
  | 'countertops'
  | 'tile'
  | 'lighting'
  | 'hardware'
  | 'appliances'
  | 'windows'
  | 'fencing'
  | 'landscaping'
  | 'roofing'
  | 'framing'
  | 'insulation'
  | 'drywall'
  | 'bathroom'
  | 'trim'
  | 'pool'
  | 'other';

interface CategoryConfig {
  value: ProcurementCategory;
  label: string;
  icon: typeof DoorOpen;
  color: string;
  fields: string[];
  placeholders?: Record<string, string>;
}

const PROCUREMENT_CATEGORIES: CategoryConfig[] = [
  { 
    value: 'appliances', 
    label: 'Appliances', 
    icon: Refrigerator, 
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    fields: ['appliance_type', 'dimensions', 'energy_rating', 'fuel_type'],
    placeholders: { appliance_type: 'Range, Refrigerator, Dishwasher', dimensions: 'W x D x H', fuel_type: 'Gas, Electric' }
  },
  { 
    value: 'bathroom', 
    label: 'Bathroom', 
    icon: Bath, 
    color: 'bg-cyan-600/10 text-cyan-500 border-cyan-500/30',
    fields: ['fixture_type', 'dimensions', 'finish', 'material'],
    placeholders: { fixture_type: 'Vanity, Mirror, Accessories', dimensions: 'W x D x H', finish: 'Chrome, Brushed Nickel, Matte Black' }
  },
  { 
    value: 'cabinets', 
    label: 'Cabinets', 
    icon: Archive, 
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    fields: ['cabinet_type', 'dimensions', 'door_style', 'wood_species'],
    placeholders: { cabinet_type: 'Base, Wall, Tall', dimensions: '36"W x 24"D x 34.5"H', door_style: 'Shaker, Raised panel' }
  },
  { 
    value: 'countertops', 
    label: 'Countertops', 
    icon: Grid3X3, 
    color: 'bg-stone-500/10 text-stone-600 border-stone-500/30',
    fields: ['material', 'edge_profile', 'thickness', 'sqft'],
    placeholders: { material: 'Quartz, Granite, Marble', edge_profile: 'Eased, Bullnose, Ogee', thickness: '2cm, 3cm' }
  },
  { 
    value: 'doors', 
    label: 'Doors', 
    icon: DoorOpen, 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    fields: ['size', 'style', 'material', 'swing', 'prehung'],
    placeholders: { size: '36" x 80"', style: 'Shaker, Panel, Flush', material: 'Solid wood, Hollow core, Fiberglass' }
  },
  { 
    value: 'drywall', 
    label: 'Drywall', 
    icon: Square, 
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    fields: ['thickness', 'sheet_size', 'type'],
    placeholders: { thickness: '1/2", 5/8"', sheet_size: '4x8, 4x12', type: 'Regular, Moisture-resistant, Fire-rated' }
  },
  { 
    value: 'electrical', 
    label: 'Electrical', 
    icon: Zap, 
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    fields: ['voltage', 'amperage', 'wire_gauge', 'circuit_type'],
    placeholders: { voltage: '120V, 240V', amperage: '15A, 20A, 30A', wire_gauge: '12 AWG, 10 AWG' }
  },
  { 
    value: 'exterior_finishes', 
    label: 'Exterior Finishes', 
    icon: Sparkles, 
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
    fields: ['material', 'coverage_sqft', 'finish', 'application'],
    placeholders: { material: 'Stucco, Siding, Stone veneer', coverage_sqft: 'Total sq ft', finish: 'Smooth, Textured', application: 'New, Repair' }
  },
  { 
    value: 'fencing', 
    label: 'Fencing', 
    icon: Fence, 
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
    fields: ['material', 'height', 'linear_feet', 'style'],
    placeholders: { material: 'Cedar, Vinyl, Metal', height: '4ft, 6ft, 8ft', linear_feet: 'Total length' }
  },
  { 
    value: 'flooring', 
    label: 'Flooring', 
    icon: RectangleHorizontal, 
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    fields: ['material', 'sqft', 'thickness', 'finish', 'underlayment'],
    placeholders: { material: 'LVP, Hardwood, Tile', sqft: 'Total sq ft needed', thickness: '6mm, 12mm, 3/4"' }
  },
  { 
    value: 'framing', 
    label: 'Framing', 
    icon: Hammer, 
    color: 'bg-amber-600/10 text-amber-700 border-amber-600/30',
    fields: ['lumber_size', 'length', 'grade', 'treatment'],
    placeholders: { lumber_size: '2x4, 2x6, 2x8', length: '8ft, 10ft, 12ft', grade: '#2, Stud grade' }
  },
  { 
    value: 'hardware', 
    label: 'Hardware', 
    icon: Wrench, 
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
    fields: ['hardware_type', 'size', 'finish'],
    placeholders: { hardware_type: 'Knobs, Pulls, Hinges', size: 'Center-to-center measurement' }
  },
  { 
    value: 'hvac', 
    label: 'HVAC', 
    icon: Wind, 
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    fields: ['btu', 'tonnage', 'seer_rating', 'duct_size'],
    placeholders: { btu: 'BTU rating', tonnage: '2 ton, 3 ton', seer_rating: 'SEER efficiency' }
  },
  { 
    value: 'insulation', 
    label: 'Insulation', 
    icon: Layers, 
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    fields: ['r_value', 'type', 'coverage_sqft'],
    placeholders: { r_value: 'R-13, R-19, R-30', type: 'Batt, Blown-in, Spray foam' }
  },
  { 
    value: 'landscaping', 
    label: 'Landscaping', 
    icon: TreePine, 
    color: 'bg-lime-500/10 text-lime-600 border-lime-500/30',
    fields: ['material', 'coverage_sqft', 'plant_type', 'quantity'],
    placeholders: { material: 'Mulch, Sod, Pavers, Gravel', coverage_sqft: 'Total sq ft', plant_type: 'Trees, Shrubs, Flowers' }
  },
  { 
    value: 'lighting', 
    label: 'Light Fixtures', 
    icon: Lightbulb, 
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    fields: ['fixture_type', 'wattage', 'lumens', 'color_temp'],
    placeholders: { fixture_type: 'Recessed, Pendant, Sconce', wattage: 'Max wattage', lumens: 'Brightness level', color_temp: '2700K, 3000K, 4000K' }
  },
  { 
    value: 'paint', 
    label: 'Paint', 
    icon: Paintbrush, 
    color: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
    fields: ['color_code', 'sheen', 'coverage_sqft', 'brand'],
    placeholders: { color_code: 'SW 7015, BM OC-17', sheen: 'Flat, Eggshell, Satin, Semi-gloss', coverage_sqft: 'Sq ft per gallon' }
  },
  { 
    value: 'plumbing', 
    label: 'Plumbing', 
    icon: Droplets, 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    fields: ['fixture_type', 'connection_size', 'finish', 'gpm'],
    placeholders: { fixture_type: 'Faucet, Toilet, Shower valve', connection_size: '1/2", 3/4"', gpm: 'Gallons per minute' }
  },
  { 
    value: 'pool', 
    label: 'Pool', 
    icon: Waves, 
    color: 'bg-blue-600/10 text-blue-500 border-blue-600/30',
    fields: ['equipment_type', 'dimensions', 'capacity', 'brand'],
    placeholders: { equipment_type: 'Pump, Filter, Heater', dimensions: 'Pool size', capacity: 'Gallons' }
  },
  { 
    value: 'roofing', 
    label: 'Roofing', 
    icon: Home, 
    color: 'bg-red-500/10 text-red-600 border-red-500/30',
    fields: ['material', 'squares', 'warranty_years'],
    placeholders: { material: 'Shingles, Metal, Tile', squares: 'Roofing squares (100 sq ft each)' }
  },
  { 
    value: 'tile', 
    label: 'Tile', 
    icon: LayoutDashboard, 
    color: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
    fields: ['tile_size', 'material', 'grout_color'],
    placeholders: { tile_size: '12x24, 4x12, 3x6', material: 'Ceramic, Porcelain, Natural stone', grout_color: 'White, Gray, Charcoal' }
  },
  { 
    value: 'trim', 
    label: 'Trim', 
    icon: Scissors, 
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    fields: ['trim_type', 'dimensions', 'material', 'profile'],
    placeholders: { trim_type: 'Baseboards, Crown, Casing', dimensions: '3.25", 5.25"', profile: 'Colonial, Craftsman, Modern' }
  },
  { 
    value: 'windows', 
    label: 'Windows', 
    icon: AppWindow, 
    color: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
    fields: ['window_type', 'dimensions', 'glass_type', 'frame_material'],
    placeholders: { window_type: 'Single-hung, Double-hung, Casement', dimensions: 'Width x Height', glass_type: 'Double-pane, Low-E' }
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: Wrench, 
    color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30',
    fields: [],
  },
];

const PHASES: { value: Phase; label: string }[] = [
  { value: 'rough_in', label: 'Rough-In' },
  { value: 'trim_out', label: 'Trim Out' },
  { value: 'finish', label: 'Finish' },
  { value: 'punch', label: 'Punch List' },
];

const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: 'researching', label: 'Researching' },
  { value: 'in_cart', label: 'In Cart' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'installed', label: 'Installed' },
];

// Stores are now managed via useCustomStores hook

const TEXAS_TAX_RATE = 0.0825;

interface FormData {
  category: ProcurementCategory | '';
  name: string;
  bundle_ids: string[];
  source_url: string;
  source_store: SourceStore;
  model_number: string;
  unit_price: string;
  quantity: string;
  includes_tax: boolean;
  is_pack_price: boolean;
  lead_time_days: string;
  phase: Phase;
  status: ItemStatus;
  finish: string;
  notes: string;
  bulk_discount_eligible: boolean;
  specs: Record<string, string>;
  image_url: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProcurementItem | null;
  bundles: Bundle[];
  onSave: () => void;
}

type Step = 'url' | 'category' | 'details';

interface ScrapedData {
  name: string;
  price: number | null;
  model_number: string | null;
  finish: string | null;
  lead_time_days: number | null;
  dimensions: string | null;
  brand: string | null;
  source_store: string;
  specs: Record<string, string>;
  image_url: string | null;
}

export function ProcurementItemModal({ open, onOpenChange, item, bundles, onSave }: Props) {
  const { user } = useAuth();
  const { stores, addStore, removeStore, resetToDefaults } = useCustomStores();
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);
  const [parsingScreenshot, setParsingScreenshot] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);
  const [step, setStep] = useState<Step>('url');
  const [urlInput, setUrlInput] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [editStoresOpen, setEditStoresOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const initialFormDataRef = useRef<string>('');
  
  const [formData, setFormData] = useState<FormData>({
    category: '',
    name: '',
    bundle_ids: [],
    source_url: '',
    source_store: 'home_depot',
    model_number: '',
    unit_price: '',
    quantity: '1',
    includes_tax: false,
    is_pack_price: false,
    lead_time_days: '',
    phase: 'rough_in',
    status: 'researching',
    finish: '',
    notes: '',
    bulk_discount_eligible: false,
    specs: {},
    image_url: '',
  });

  const handleAddStore = () => {
    if (!newStoreName.trim()) return;
    if (addStore(newStoreName.trim())) {
      toast.success(`Added "${newStoreName}" to stores`);
      setNewStoreName('');
    } else {
      toast.error('Store already exists');
    }
  };

  const handleRemoveStore = (value: string) => {
    const store = stores.find(s => s.value === value);
    removeStore(value);
    toast.success(`Removed "${store?.label || value}" from stores`);
  };

  const handleResetStores = () => {
    resetToDefaults();
    toast.success('Stores reset to defaults');
  };

  // Image upload handler
  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    setImageUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('procurement-images')
        .upload(fileName, file);
      
      if (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload image');
        return;
      }
      
      const { data } = supabase.storage.from('procurement-images').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadImage(file);
    }
  };

  // Handle paste events for image upload (details step) or screenshot parsing (url step with fallback)
  useEffect(() => {
    if (!open) return;
    
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const clipboardItem of items) {
        if (clipboardItem.type.startsWith('image/')) {
          e.preventDefault();
          const file = clipboardItem.getAsFile();
          if (file) {
            // If on URL step with fallback showing - parse as product screenshot
            if (step === 'url' && showFallbackOptions) {
              await handleScreenshotUpload(file);
            } 
            // If on details step - upload as product image
            else if (step === 'details') {
              await uploadImage(file);
            }
          }
          break;
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [open, step, showFallbackOptions]);

  // Parse specs from notes field (stored as JSON)
  const parseSpecsFromNotes = (notes: string | null): { specs: Record<string, string>; cleanNotes: string } => {
    if (!notes) return { specs: {}, cleanNotes: '' };
    try {
      const match = notes.match(/\[SPECS:(.*?)\]/);
      if (match) {
        const specs = JSON.parse(match[1]);
        const cleanNotes = notes.replace(/\[SPECS:.*?\]/, '').trim();
        return { specs, cleanNotes };
      }
    } catch {}
    return { specs: {}, cleanNotes: notes };
  };

  // Serialize specs into notes
  const serializeSpecsToNotes = (specs: Record<string, string>, notes: string): string => {
    const hasSpecs = Object.values(specs).some(v => v.trim());
    if (!hasSpecs) return notes;
    return `${notes}${notes ? '\n' : ''}[SPECS:${JSON.stringify(specs)}]`;
  };

  // Detect category from item name or existing specs
  const detectCategory = (itemName: string): ProcurementCategory => {
    const name = itemName.toLowerCase();
    if (name.includes('door')) return 'doors';
    if (name.includes('floor') || name.includes('lvp') || name.includes('hardwood')) return 'flooring';
    if (name.includes('faucet') || name.includes('toilet') || name.includes('sink') || name.includes('shower')) return 'plumbing';
    if (name.includes('switch') || name.includes('outlet') || name.includes('breaker') || name.includes('wire')) return 'electrical';
    if (name.includes('hvac') || name.includes('furnace') || name.includes('ac') || name.includes('mini split')) return 'hvac';
    if (name.includes('paint') || name.includes('primer')) return 'paint';
    if (name.includes('cabinet')) return 'cabinets';
    if (name.includes('counter') || name.includes('quartz') || name.includes('granite')) return 'countertops';
    if (name.includes('tile') || name.includes('grout')) return 'tile';
    if (name.includes('light') || name.includes('fixture') || name.includes('chandelier') || name.includes('sconce')) return 'lighting';
    if (name.includes('knob') || name.includes('pull') || name.includes('hinge') || name.includes('handle')) return 'hardware';
    if (name.includes('refrigerator') || name.includes('range') || name.includes('dishwasher') || name.includes('microwave')) return 'appliances';
    if (name.includes('window')) return 'windows';
    if (name.includes('fence')) return 'fencing';
    if (name.includes('landscap') || name.includes('mulch') || name.includes('sod') || name.includes('paver') || name.includes('shrub') || name.includes('plant')) return 'landscaping';
    if (name.includes('stucco') || name.includes('siding') || name.includes('stone veneer') || name.includes('hardie') || name.includes('exterior paint') || name.includes('mailbox')) return 'exterior_finishes';
    if (name.includes('shingle') || name.includes('roof')) return 'roofing';
    if (name.includes('lumber') || name.includes('2x4') || name.includes('2x6') || name.includes('stud')) return 'framing';
    if (name.includes('insulation') || name.includes('r-')) return 'insulation';
    if (name.includes('drywall') || name.includes('sheetrock')) return 'drywall';
    if (name.includes('bathroom') || name.includes('vanity') || name.includes('mirror') || name.includes('towel')) return 'bathroom';
    if (name.includes('trim') || name.includes('baseboard') || name.includes('crown') || name.includes('casing') || name.includes('molding')) return 'trim';
    if (name.includes('pool') || name.includes('pump') || name.includes('filter') || name.includes('chlorine')) return 'pool';
    return 'other';
  };

  useEffect(() => {
    const loadItemBundles = async () => {
      if (open && item) {
        // Fetch bundle assignments for this item from junction table
        const { data: bundleAssignments } = await supabase
          .from('procurement_item_bundles')
          .select('bundle_id')
          .eq('item_id', item.id);
        
        const bundleIds = bundleAssignments?.map(b => b.bundle_id) || [];
        
        const { specs, cleanNotes } = parseSpecsFromNotes(item.notes);
        const detectedCategory = detectCategory(item.name);
        // Use stored category if available, otherwise detect from name
        const storedCategory = (item as any).category;
        const itemCategory = storedCategory && storedCategory !== 'other' ? storedCategory : detectedCategory;
        
        setFormData({
          category: itemCategory,
          name: item.name,
          bundle_ids: bundleIds,
          source_url: item.source_url || '',
          source_store: item.source_store || 'home_depot',
          model_number: item.model_number || '',
          unit_price: item.unit_price.toString(),
          quantity: item.quantity.toString(),
          includes_tax: item.includes_tax ?? false,
          is_pack_price: (item as any).is_pack_price ?? false,
          lead_time_days: item.lead_time_days?.toString() || '',
          phase: item.phase || 'rough_in',
          status: item.status || 'researching',
          finish: item.finish || '',
          notes: cleanNotes,
          bulk_discount_eligible: item.bulk_discount_eligible ?? false,
          specs,
          image_url: (item as any).image_url || '',
        });
        setStep('details');
        setUrlInput('');
        setShowFallbackOptions(false);
        setScrapeSuccess(false);
      } else if (open) {
        setFormData({
          category: '',
          name: '',
          bundle_ids: [],
          source_url: '',
          source_store: 'home_depot',
          model_number: '',
          unit_price: '',
          quantity: '1',
          includes_tax: false,
          is_pack_price: false,
          lead_time_days: '',
          phase: 'rough_in',
          status: 'researching',
          finish: '',
          notes: '',
          bulk_discount_eligible: false,
          specs: {},
          image_url: '',
        });
        setStep('url');
        setUrlInput('');
        setShowFallbackOptions(false);
        setScrapeSuccess(false);
      }
    };
    
    loadItemBundles();
  }, [item, open]);

  // Store initial form data when entering edit mode to detect changes
  useEffect(() => {
    if (open && item && step === 'details') {
      initialFormDataRef.current = JSON.stringify(formData);
    }
  }, [open, item, step === 'details']);

  // Auto-save helper function for edit mode
  const handleAutoSave = async () => {
    if (!item || !formData.name || !formData.unit_price) return;
    
    // Don't save if no changes
    if (JSON.stringify(formData) === initialFormDataRef.current) return;
    
    setAutoSaving(true);
    
    const finalNotes = serializeSpecsToNotes(formData.specs, formData.notes);
    
    const payload = {
      name: formData.name,
      category: formData.category || 'other',
      bundle_id: formData.bundle_ids.length > 0 ? formData.bundle_ids[0] : null,
      source_url: formData.source_url || null,
      source_store: formData.source_store,
      model_number: formData.model_number || null,
      unit_price: parseFloat(formData.unit_price),
      quantity: parseInt(formData.quantity) || 1,
      includes_tax: formData.includes_tax,
      is_pack_price: formData.is_pack_price,
      tax_rate: TEXAS_TAX_RATE,
      lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : null,
      phase: formData.phase,
      status: formData.status,
      finish: formData.finish || null,
      notes: finalNotes || null,
      bulk_discount_eligible: formData.bulk_discount_eligible,
      image_url: formData.image_url || null,
      user_id: user?.id,
    };

    const { error } = await supabase
      .from('procurement_items')
      .update(payload)
      .eq('id', item.id);

    if (!error) {
      // Update bundle assignments
      await supabase
        .from('procurement_item_bundles')
        .delete()
        .eq('item_id', item.id);
      
      if (formData.bundle_ids.length > 0) {
        await supabase
          .from('procurement_item_bundles')
          .insert(formData.bundle_ids.map(bundleId => ({
            item_id: item.id,
            bundle_id: bundleId,
          })));
      }
      
      setLastSaved(new Date());
      initialFormDataRef.current = JSON.stringify(formData);
      onSave(); // Refresh parent data
    }
    
    setAutoSaving(false);
  };

  // Debounced auto-save effect for edit mode
  useEffect(() => {
    if (!item || step !== 'details' || !open) return;
    
    // Skip initial render
    if (!initialFormDataRef.current) return;
    
    const timeoutId = setTimeout(() => {
      handleAutoSave();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [formData, item, step, open]);

  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) {
      setStep('category');
      return;
    }

    setScraping(true);
    setShowFallbackOptions(false);
    setScrapeSuccess(false);

    // Create abort controller with 10s client-side timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-product-url', {
        body: { url: urlInput.trim() },
      });

      clearTimeout(timeoutId);

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape URL');
      }

      const scraped: ScrapedData = data.data;
      const detectedCategory = detectCategory(scraped.name);
      const storeValue = stores.find(s => s.value === scraped.source_store)?.value || 'other';

      // Update form with scraped data
      setFormData(prev => ({
        ...prev,
        name: scraped.name || prev.name,
        source_url: urlInput.trim(),
        source_store: storeValue as SourceStore,
        model_number: scraped.model_number || prev.model_number,
        unit_price: scraped.price?.toString() || prev.unit_price,
        finish: scraped.finish || prev.finish,
        lead_time_days: scraped.lead_time_days?.toString() || prev.lead_time_days,
        category: detectedCategory,
        specs: { ...prev.specs, ...scraped.specs },
        image_url: scraped.image_url || prev.image_url,
      }));

      setScrapeSuccess(true);
      toast.success('Product data extracted!');
      
      // Move to category step to confirm/change category
      setTimeout(() => setStep('category'), 500);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Scrape error:', err);
      
      // Check if it was a timeout abort
      if (err?.name === 'AbortError') {
        toast.error('Scraping timed out. Try pasting a screenshot instead.');
      }
      
      // Show friendly fallback options
      setShowFallbackOptions(true);
    } finally {
      setScraping(false);
    }
  };

  // Detect store from URL
  const detectStoreFromUrl = (url: string): SourceStore => {
    if (url.includes('homedepot')) return 'home_depot';
    if (url.includes('lowes')) return 'lowes';
    if (url.includes('amazon')) return 'amazon';
    if (url.includes('build.com')) return 'build';
    if (url.includes('ferguson')) return 'ferguson';
    if (url.includes('flooranddecor')) return 'floor_decor';
    return 'other';
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  // Helper to upload base64 image to Supabase storage
  const uploadBase64Image = async (base64Data: string): Promise<string> => {
    // Convert base64 to blob
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    const fileName = `${Date.now()}-ai-extracted.png`;
    const { error } = await supabase.storage
      .from('procurement-images')
      .upload(fileName, blob);
    
    if (error) throw error;
    
    const { data } = supabase.storage.from('procurement-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Handle screenshot upload for AI parsing
  const handleScreenshotUpload = async (file: File) => {
    setParsingScreenshot(true);
    try {
      const base64 = await fileToBase64(file);
      
      const { data, error } = await supabase.functions.invoke('parse-product-screenshot', {
        body: { image_base64: base64 }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to parse screenshot');
      }
      
      // If AI extracted a product image, upload it to storage
      let imageUrl = '';
      if (data.data.product_image) {
        try {
          imageUrl = await uploadBase64Image(data.data.product_image);
          toast.success('Product image extracted!');
        } catch (uploadError) {
          console.error('Failed to upload extracted image:', uploadError);
          // Continue without image - don't fail the whole operation
        }
      }
      
      // Populate form with parsed data including image
      setFormData(prev => ({
        ...prev,
        name: data.data.name || prev.name,
        unit_price: data.data.price?.toString() || prev.unit_price,
        model_number: data.data.model_number || prev.model_number,
        finish: data.data.finish || prev.finish,
        source_url: urlInput.trim(),
        source_store: detectStoreFromUrl(urlInput),
        image_url: imageUrl || prev.image_url,
      }));
      
      setShowFallbackOptions(false);
      setStep('category');
      toast.success('Product info extracted from screenshot!');
    } catch (err) {
      console.error('Screenshot parse error:', err);
      toast.error('Could not read screenshot - try entering manually');
    } finally {
      setParsingScreenshot(false);
    }
  };

  const handleCategorySelect = (category: ProcurementCategory) => {
    setFormData(prev => ({ ...prev, category }));
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.unit_price) {
      toast.error('Name and price are required');
      return;
    }

    setLoading(true);
    
    // Combine notes with specs
    const finalNotes = serializeSpecsToNotes(formData.specs, formData.notes);
    
    const payload = {
      name: formData.name,
      category: formData.category || 'other',
      bundle_id: formData.bundle_ids.length > 0 ? formData.bundle_ids[0] : null, // Keep for backwards compat
      source_url: formData.source_url || null,
      source_store: formData.source_store,
      model_number: formData.model_number || null,
      unit_price: parseFloat(formData.unit_price),
      quantity: parseInt(formData.quantity) || 1,
      includes_tax: formData.includes_tax,
      is_pack_price: formData.is_pack_price,
      tax_rate: TEXAS_TAX_RATE,
      lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : null,
      phase: formData.phase,
      status: formData.status,
      finish: formData.finish || null,
      notes: finalNotes || null,
      bulk_discount_eligible: formData.bulk_discount_eligible,
      image_url: formData.image_url || null,
      user_id: user?.id,
    };

    let error;
    let itemId = item?.id;
    
    if (item) {
      const result = await supabase
        .from('procurement_items')
        .update(payload)
        .eq('id', item.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('procurement_items')
        .insert(payload)
        .select('id')
        .single();
      error = result.error;
      itemId = result.data?.id;
    }

    if (error) {
      setLoading(false);
      toast.error('Failed to save item');
      console.error(error);
      return;
    }

    // Update bundle assignments in junction table
    if (itemId) {
      // Delete existing assignments
      await supabase
        .from('procurement_item_bundles')
        .delete()
        .eq('item_id', itemId);
      
      // Insert new assignments
      if (formData.bundle_ids.length > 0) {
        const { error: bundleError } = await supabase
          .from('procurement_item_bundles')
          .insert(formData.bundle_ids.map(bundleId => ({
            item_id: itemId,
            bundle_id: bundleId,
          })));
        
        if (bundleError) {
          console.error('Failed to save bundle assignments:', bundleError);
        }
      }
    }

    setLoading(false);
    toast.success(item ? 'Item updated' : 'Item added');
    onOpenChange(false);
    onSave();
  };

  const selectedCategory = PROCUREMENT_CATEGORIES.find(c => c.value === formData.category);
  // If pack price, don't multiply by quantity - the price is for the whole pack
  const basePrice = parseFloat(formData.unit_price) || 0;
  const quantity = parseInt(formData.quantity) || 1;
  const subtotal = formData.is_pack_price ? basePrice : basePrice * quantity;
  const tax = formData.includes_tax ? 0 : subtotal * TEXAS_TAX_RATE;
  const total = subtotal + tax;

  const renderUrlStep = () => (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <LinkIcon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold">Paste Product URL</h3>
        <p className="text-sm text-muted-foreground">
          Paste a link from Amazon, Home Depot, Lowe's, or other retailers.<br />
          We'll extract the product details automatically.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://www.homedepot.com/p/..."
          className="text-center"
          disabled={scraping}
        />
        
        {showFallbackOptions && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted p-3 rounded-lg">
              <LinkIcon className="h-4 w-4 flex-shrink-0" />
              <span>Couldn't auto-extract from this page. No worries!</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Enter Manually Card */}
              <button
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    source_url: urlInput.trim(),
                    source_store: detectStoreFromUrl(urlInput),
                  }));
                  setShowFallbackOptions(false);
                  setStep('category');
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Pencil className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium">Enter Manually</span>
                <span className="text-xs text-muted-foreground text-center">Type in the details yourself</span>
              </button>
              
              {/* Upload Screenshot Card */}
              <button
                onClick={() => screenshotInputRef.current?.click()}
                disabled={parsingScreenshot}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {parsingScreenshot ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Camera className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="font-medium">Upload Screenshot</span>
                <span className="text-xs text-muted-foreground text-center">Ctrl+V to paste or click to browse</span>
              </button>
            </div>
            
            <input
              type="file"
              ref={screenshotInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleScreenshotUpload(file);
                e.target.value = '';
              }}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}

        {scrapeSuccess && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-500/10 p-2 rounded">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Product data extracted successfully!</span>
          </div>
        )}

        <Button 
          onClick={handleScrapeUrl} 
          className="w-full" 
          disabled={scraping}
        >
          {scraping ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Extracting product data...
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4 mr-2" />
              {urlInput.trim() ? 'Extract Product Data' : 'Skip & Enter Manually'}
            </>
          )}
        </Button>
      </div>

      <div className="text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setStep('category')}
          disabled={scraping}
        >
          Or enter details manually →
        </Button>
      </div>
    </div>
  );

  const renderCategoryStep = () => (
    <div className="space-y-4 py-4">
      <p className="text-sm text-muted-foreground">
        {formData.name ? (
          <>Confirm category for: <strong className="text-foreground">{formData.name}</strong></>
        ) : (
          'Select a category to see relevant specification fields:'
        )}
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {PROCUREMENT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = formData.category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => handleCategorySelect(cat.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
                "hover:border-primary/50 hover:bg-primary/5",
                isSelected ? "border-primary bg-primary/10" : "border-transparent",
                cat.color
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSpecField = (field: string, placeholder?: string) => {
    const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (
      <div key={field}>
        <Label className="text-xs">{fieldLabel}</Label>
        <Input
          value={formData.specs[field] || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            specs: { ...prev.specs, [field]: e.target.value }
          }))}
          placeholder={placeholder || fieldLabel}
          className="h-9"
        />
      </div>
    );
  };

  const renderDetailsStep = () => (
    <div className="space-y-4 py-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Item Name */}
        <div className="col-span-2">
          <Label>Item Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={selectedCategory?.value === 'doors' ? 'e.g., 36" Shaker Interior Door' : 'Item description'}
          />
        </div>

        {/* Product Image Section */}
        <div className="col-span-2">
          <Label className="mb-2 block">Product Image</Label>
          <div className="flex gap-4 items-start">
            {/* Image Preview */}
            <div className="w-24 h-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {imageUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : formData.image_url ? (
                <img 
                  src={formData.image_url} 
                  alt="Product" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            
            {/* Upload Drop Zone */}
            <div 
              className={cn(
                "flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                isDraggingImage ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50",
                imageUploading && "pointer-events-none opacity-50"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drop image or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Ctrl+V to paste</p>
            </div>
          </div>
          
          {formData.image_url && (
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="mt-2 text-muted-foreground hover:text-destructive"
              onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
            >
              <X className="h-3 w-3 mr-1" />
              Remove image
            </Button>
          )}
        </div>

        {/* Category-specific fields */}
        {selectedCategory && selectedCategory.fields.length > 0 && (
          <div className="col-span-2 p-3 bg-muted/50 rounded-lg space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {selectedCategory.label} Specifications
            </p>
            <div className="grid grid-cols-2 gap-3">
              {selectedCategory.fields.map(field => 
                renderSpecField(field, selectedCategory.placeholders?.[field])
              )}
            </div>
          </div>
        )}

        {/* Bundle Assignment - Dropdown Multi-select */}
        <div className="col-span-2">
          <Label className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4" />
            Assign to Bundles
          </Label>
          {bundles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bundles available</p>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {formData.bundle_ids.length === 0 
                    ? "Select bundles..." 
                    : `${formData.bundle_ids.length} bundle(s) selected`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-2 max-h-48 overflow-y-auto">
                {bundles.map(b => (
                  <label 
                    key={b.id} 
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.bundle_ids.includes(b.id)}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          bundle_ids: checked 
                            ? [...prev.bundle_ids, b.id]
                            : prev.bundle_ids.filter(id => id !== b.id)
                        }));
                      }}
                    />
                    <span className="text-sm">{b.name}</span>
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          )}
          {formData.bundle_ids.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.bundle_ids.map(id => {
                const bundle = bundles.find(b => b.id === id);
                return bundle ? (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {bundle.name}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Source */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Source Store</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setEditStoresOpen(true)}
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
          <Select 
            value={formData.source_store} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, source_store: v as SourceStore }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stores.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Source URL</Label>
          <Input
            value={formData.source_url}
            onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        <div>
          <Label>Finish / Color</Label>
          <Input
            value={formData.finish}
            onChange={(e) => setFormData(prev => ({ ...prev, finish: e.target.value }))}
            placeholder="e.g., Matte Black"
          />
        </div>

        {/* Pricing */}
        <div>
          <Label>{formData.is_pack_price ? 'Pack Price *' : 'Unit Price *'}</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              step="0.01"
              value={formData.unit_price}
              onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
              className="pl-10"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label>Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as ProcurementCategory }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {PROCUREMENT_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{formData.is_pack_price ? 'Units in Pack' : 'Quantity'}</Label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            min="1"
          />
          {formData.is_pack_price && (
            <p className="text-xs text-muted-foreground mt-1">
              For reference only - price won't be multiplied
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes..."
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_pack_price}
            onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_pack_price: v }))}
          />
          <Label className="flex flex-col">
            <span>Pack price</span>
            <span className="text-xs text-muted-foreground font-normal">Price is for the whole pack, not per unit</span>
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={formData.includes_tax}
            onCheckedChange={(v) => setFormData(prev => ({ ...prev, includes_tax: v }))}
          />
          <Label>Price includes tax</Label>
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
  );

  const getDialogTitle = () => {
    if (item) return 'Edit Item';
    switch (step) {
      case 'url': return 'Add from URL';
      case 'category': return 'Select Category';
      case 'details': return 'Add Procurement Item';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>

          {step === 'url' && renderUrlStep()}
          {step === 'category' && renderCategoryStep()}
          {step === 'details' && renderDetailsStep()}

          <DialogFooter>
            {step === 'category' && !item && (
              <Button variant="outline" onClick={() => setStep('url')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step === 'details' && !item && (
              <Button variant="outline" onClick={() => setStep('category')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            {/* Edit mode: show save status indicator */}
            {step === 'details' && item && (
              <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
                {autoSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Saved</span>
                  </>
                ) : null}
              </div>
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {item ? 'Close' : 'Cancel'}
            </Button>
            
            {/* Only show Add Item button for new items */}
            {step === 'details' && !item && (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Add Item'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stores Dialog */}
      <Dialog open={editStoresOpen} onOpenChange={setEditStoresOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Source Stores</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stores.map((store) => (
                <div 
                  key={store.value} 
                  className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                >
                  <span className="text-sm">{store.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveStore(store.value)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Add new store..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
              />
              <Button onClick={handleAddStore} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleResetStores}
              className="mr-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={() => setEditStoresOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
