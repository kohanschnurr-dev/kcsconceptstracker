import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart } from 'lucide-react';
import { useOrderRequests, SelectedProcurementItem } from '@/hooks/useOrderRequests';

interface SubmitOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: SelectedProcurementItem[];
  onSuccess?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

export function SubmitOrderModal({ open, onOpenChange, selectedItems, onSuccess }: SubmitOrderModalProps) {
  const [notes, setNotes] = useState('');
  const { submitOrder } = useOrderRequests();

  const totalValue = selectedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const handleSubmit = async () => {
    await submitOrder.mutateAsync({ selectedItems, notes });
    setNotes('');
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Submit Order Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item list */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Est. Total: <span className="text-foreground font-mono">{formatCurrency(totalValue)}</span>
              </span>
            </div>
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {selectedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground font-mono">{formatCurrency(item.unit_price)}</span>
                      <Badge variant="secondary" className="text-xs py-0">×{item.quantity}</Badge>
                      {item.source_store && (
                        <span className="text-xs text-muted-foreground">{item.source_store}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-mono font-medium shrink-0">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="Add a note for the owner — urgency, project context, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitOrder.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitOrder.isPending || selectedItems.length === 0}>
            {submitOrder.isPending ? 'Submitting…' : 'Submit Order Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
