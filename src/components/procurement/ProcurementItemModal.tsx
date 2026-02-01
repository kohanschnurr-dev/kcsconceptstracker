import { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types
type ItemStatus = 'researching' | 'in_cart' | 'ordered' | 'delivered' | 'installed';
type Phase = 'rough_in' | 'trim_out' | 'finish' | 'punch';
type SourceStore = 'amazon' | 'home_depot' | 'lowes' | 'floor_decor' | 'build' | 'ferguson' | 'other';

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
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);
  const [step, setStep] = useState<Step>('url');
  const [urlInput, setUrlInput] = useState('');
  
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
    if (name.includes('knob') || name.includes('pull') || name.includes('hinge')) return 'hardware';
    if (name.includes('refrigerator') || name.includes('range') || name.includes('dishwasher') || name.includes('microwave')) return 'appliances';
    if (name.includes('window')) return 'windows';
    if (name.includes('fence')) return 'fencing';
    if (name.includes('landscap') || name.includes('mulch') || name.includes('sod') || name.includes('paver') || name.includes('shrub') || name.includes('plant')) return 'landscaping';
    if (name.includes('stucco') || name.includes('siding') || name.includes('stone veneer') || name.includes('hardie') || name.includes('exterior paint')) return 'exterior_finishes';
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
        
        setFormData({
          category: detectedCategory,
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
        setScrapeError(null);
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
        setScrapeError(null);
        setScrapeSuccess(false);
      }
    };
    
    loadItemBundles();
  }, [item, open]);

  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) {
      setStep('category');
      return;
    }

    setScraping(true);
    setScrapeError(null);
    setScrapeSuccess(false);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-product-url', {
        body: { url: urlInput.trim() },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape URL');
      }

      const scraped: ScrapedData = data.data;
      const detectedCategory = detectCategory(scraped.name);
      const storeValue = STORES.find(s => s.value === scraped.source_store)?.value || 'other';

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
    } catch (err) {
      console.error('Scrape error:', err);
      const message = err instanceof Error ? err.message : 'Failed to scrape URL';
      setScrapeError(message);
      toast.error(message);
    } finally {
      setScraping(false);
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
          We'll extract the product details automatically for Dallas/DFW.
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
        
        {scrapeError && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{scrapeError}</span>
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
      {/* Category Badge */}
      {selectedCategory && (
        <div className="flex items-center gap-2">
          <Badge className={cn('gap-1', selectedCategory.color)}>
            <selectedCategory.icon className="h-3 w-3" />
            {selectedCategory.label}
          </Badge>
          {!item && (
            <Button variant="ghost" size="sm" onClick={() => setStep('category')} className="h-6 text-xs">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Change
            </Button>
          )}
        </div>
      )}

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
          <Label>Source Store</Label>
          <Select 
            value={formData.source_store} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, source_store: v as SourceStore }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        <div>
          <Label>Model Number</Label>
          <Input
            value={formData.model_number}
            onChange={(e) => setFormData(prev => ({ ...prev, model_number: e.target.value }))}
            placeholder="SKU or model #"
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

        <div>
          <Label>Phase</Label>
          <Select 
            value={formData.phase} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, phase: v as Phase }))}
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
            onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as ItemStatus }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, lead_time_days: e.target.value }))}
            placeholder="Optional"
          />
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

        <div className="flex items-center gap-2">
          <Switch
            checked={formData.bulk_discount_eligible}
            onCheckedChange={(v) => setFormData(prev => ({ ...prev, bulk_discount_eligible: v }))}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step === 'details' && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
