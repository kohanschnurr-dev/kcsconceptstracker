import { ExternalLink, Package, Store, Clock, Tag, FileText, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Phase = 'demo' | 'rough_in' | 'drywall' | 'trim_out' | 'finish' | 'punch' | 'final';
type SourceStore = 'amazon' | 'home_depot' | 'lowes' | 'floor_decor' | 'build' | 'ferguson' | 'other';
type ItemStatus = 'researching' | 'in_cart' | 'ordered' | 'delivered' | 'installed';

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

interface ProcurementItemDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProcurementItem | null;
  onEdit: () => void;
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

const STATUSES: { value: ItemStatus; label: string; color: string }[] = [
  { value: 'researching', label: 'Researching', color: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
  { value: 'in_cart', label: 'In Cart', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  { value: 'ordered', label: 'Ordered', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
  { value: 'installed', label: 'Installed', color: 'bg-primary/10 text-primary border-primary/30' },
];

export function ProcurementItemDetailModal({
  open,
  onOpenChange,
  item,
  onEdit,
}: ProcurementItemDetailModalProps) {
  if (!item) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateTotal = () => {
    const subtotal = item.unit_price * item.quantity;
    const tax = item.includes_tax ? 0 : subtotal * item.tax_rate;
    return subtotal + tax;
  };

  const getStoreLabel = () => STORES.find(s => s.value === item.source_store)?.label || 'Unknown';
  const getPhaseLabel = () => PHASES.find(p => p.value === item.phase)?.label || 'Not set';
  const getStatusInfo = () => STATUSES.find(s => s.value === item.status) || STATUSES[0];

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Item Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Name & Status */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                {item.model_number && (
                  <p className="text-sm text-muted-foreground">SKU: {item.model_number}</p>
                )}
              </div>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>

            {item.finish && (
              <div className="mt-2">
                <Badge variant="secondary">{item.finish}</Badge>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Unit Price</p>
              <p className="font-mono font-semibold">{formatCurrency(item.unit_price)}</p>
            </div>
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Quantity</p>
              <p className="font-mono font-semibold">{item.quantity}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="font-mono font-semibold text-primary">{formatCurrency(calculateTotal())}</p>
            </div>
          </div>

          {item.includes_tax ? (
            <p className="text-xs text-muted-foreground text-center">Price includes tax</p>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              + {(item.tax_rate * 100).toFixed(2)}% tax applied
            </p>
          )}

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium">{getStoreLabel()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phase</p>
                <p className="text-sm font-medium">{getPhaseLabel()}</p>
              </div>
            </div>

            {item.lead_time_days && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Lead Time</p>
                  <p className="text-sm font-medium">{item.lead_time_days} days</p>
                </div>
              </div>
            )}

            {item.bulk_discount_eligible && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Bulk Discount</p>
                  <p className="text-sm font-medium text-success">Eligible</p>
                </div>
              </div>
            )}
          </div>

          {/* Source URL */}
          {item.source_url && (
            <>
              <Separator />
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">View Product Page</span>
              </a>
            </>
          )}

          {/* Notes */}
          {item.notes && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Notes</p>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                  {item.notes}
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button 
              className="flex-1" 
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
            >
              Edit Item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
