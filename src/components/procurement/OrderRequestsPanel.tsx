import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShoppingBag,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrderRequests, OrderRequest, OrderRequestItem } from '@/hooks/useOrderRequests';
import { format } from 'date-fns';

interface OrderRequestsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

function LineItem({
  item,
  onDecision,
}: {
  item: OrderRequestItem;
  onDecision: (id: string, decision: 'approved' | 'rejected' | null, notes?: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(item.owner_notes || '');

  const handleToggle = (decision: 'approved' | 'rejected') => {
    const next = item.owner_decision === decision ? null : decision;
    onDecision(item.id, next, next === null ? undefined : noteText);
  };

  return (
    <div className="flex flex-col gap-1.5 py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
          {item.item_image_url ? (
            <img src={item.item_image_url} alt={item.item_name} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.item_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(item.unit_price)}</span>
            <Badge variant="secondary" className="text-xs py-0">×{item.quantity}</Badge>
            {item.item_source_store && (
              <span className="text-xs text-muted-foreground">{item.item_source_store}</span>
            )}
            {item.item_source_url && (
              <a
                href={item.item_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'h-7 w-7',
              item.owner_decision === 'approved'
                ? 'bg-success/20 text-success hover:bg-success/30'
                : 'text-muted-foreground hover:text-success'
            )}
            onClick={() => handleToggle('approved')}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'h-7 w-7',
              item.owner_decision === 'rejected'
                ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                : 'text-muted-foreground hover:text-destructive'
            )}
            onClick={() => handleToggle('rejected')}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setNoteOpen(o => !o)}
          >
            {noteOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      {noteOpen && (
        <div className="pl-12 flex gap-2">
          <Textarea
            placeholder="Optional note for this item…"
            rows={2}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            className="text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="self-end"
            onClick={() => {
              onDecision(item.id, item.owner_decision, noteText);
              setNoteOpen(false);
            }}
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onDecision, onMarkComplete }: {
  order: OrderRequest;
  onDecision: (itemId: string, decision: 'approved' | 'rejected' | null, notes?: string) => void;
  onMarkComplete: (orderId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { markOrderComplete } = useOrderRequests();

  const approvedCount = order.items.filter(i => i.owner_decision === 'approved').length;
  const allReviewed = order.items.every(i => i.owner_decision !== null);
  const isCompleted = order.status === 'completed';

  const statusColor = {
    pending: 'bg-warning/20 text-warning',
    partially_approved: 'bg-primary/20 text-primary',
    completed: 'bg-success/20 text-success',
    rejected: 'bg-destructive/20 text-destructive',
  }[order.status] || 'bg-muted text-muted-foreground';

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Card Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{order.submitter_name}</span>
            <Badge className={cn('text-xs', statusColor)} variant="secondary">
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
            </span>
            <span className="text-xs text-muted-foreground">
              · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3">
          {/* PM Notes */}
          {order.notes && (
            <div className="bg-muted/40 rounded-md px-3 py-2 text-sm text-muted-foreground italic">
              "{order.notes}"
            </div>
          )}

          {/* Line items */}
          <div>
            {order.items.map(item => (
              <LineItem key={item.id} item={item} onDecision={onDecision} />
            ))}
          </div>

          {/* Footer actions */}
          {!isCompleted && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                {approvedCount} / {order.items.length} approved
              </span>
              <Button
                size="sm"
                disabled={approvedCount === 0 || markOrderComplete.isPending}
                onClick={() => onMarkComplete(order.id)}
                className="gap-1.5"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Mark Purchased ({approvedCount})
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 text-xs text-success pt-1">
              <Check className="h-3.5 w-3.5" />
              Order completed — approved items marked as Ordered
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function OrderRequestsPanel({ open, onOpenChange }: OrderRequestsPanelProps) {
  const { orderRequests, isLoading, updateItemDecision, markOrderComplete, pendingCount } = useOrderRequests();

  const handleDecision = (itemId: string, decision: 'approved' | 'rejected' | null, notes?: string) => {
    updateItemDecision.mutate({ itemId, decision, ownerNotes: notes });
  };

  const handleMarkComplete = (orderId: string) => {
    markOrderComplete.mutate(orderId);
  };

  const activeOrders = orderRequests.filter(r => r.status !== 'completed' && r.status !== 'rejected');
  const completedOrders = orderRequests.filter(r => r.status === 'completed' || r.status === 'rejected');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Order Requests
            {pendingCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">{pendingCount}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading orders…</p>
          ) : orderRequests.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No order requests yet</p>
              <p className="text-xs text-muted-foreground">
                Project managers can submit order requests from the Procurement page
              </p>
            </div>
          ) : (
            <>
              {activeOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pending / Active
                  </h3>
                  {activeOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onDecision={handleDecision}
                      onMarkComplete={handleMarkComplete}
                    />
                  ))}
                </div>
              )}

              {completedOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Completed / Rejected
                  </h3>
                  {completedOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onDecision={handleDecision}
                      onMarkComplete={handleMarkComplete}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
