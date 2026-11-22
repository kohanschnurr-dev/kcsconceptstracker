import { useState } from 'react';
import { Copy, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { formatDisplayDate } from '@/lib/dateUtils';
import { openReceiptPair, type DuplicateFlagsApi } from '@/hooks/useDuplicateFlags';

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  recordKey: string;
  api: DuplicateFlagsApi;
  onChanged?: () => void;
  className?: string;
}

export function DuplicateBadge(props: Props) {
  return (
    <>
      <DupFlagBadge {...props} />
      <ReceiptPairBadge {...props} />
    </>
  );
}

function ReceiptPairBadge({ recordKey, api, onChanged, className }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const pair = typeof api.pairFor === "function" ? api.pairFor(recordKey) : undefined;
  const self = api.byKey.get(recordKey);
  if (!pair || !self) return null;
  const other = pair.other;
  const isReceipt = self.source === 'receipt';
  const receipt = isReceipt ? self : other;
  const charge = isReceipt ? other : self;
  const close = pair.level === 'receipt_close';
  const label = close ? 'Close match' : isReceipt ? 'Bank charge pending' : 'Receipt in queue';
  const chargeImported = charge.source === 'qb_project';
  const tip = isReceipt
    ? `${close ? 'Close match: ' : ''}Bank charge ${other.vendor || 'Unknown'}, ${formatDisplayDate(other.date)}, ${money(other.amount)}${chargeImported ? ` (already on ${other.location})` : ' (pending)'}`
    : `${close ? 'Close match: ' : ''}Receipt in queue: ${other.vendor || 'Unknown'}, ${formatDisplayDate(other.date)}, ${money(other.amount)}, ${other.itemCount ?? 0} ${other.itemCount === 1 ? 'item' : 'items'}`;

  const link = () => {
    const base = charge.key.replace(/^qb:/, '');
    if (!openReceiptPair(receipt.ids[0], base)) {
      toast({ title: 'Open the receipt panel', description: 'Open Expenses or KCS Concepts with the SmartSplit receipt panel to link this receipt.' });
    }
  };
  const notSame = async () => {
    setBusy(true);
    try {
      await api.dismiss(recordKey, other.key);
      toast({ title: 'Marked as not the same' });
      onChanged?.();
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={busy}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn('inline-flex shrink-0', className)}
                aria-label={tip}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1 text-[10px] px-1.5 py-0 cursor-pointer whitespace-nowrap',
                    close ? 'border-warning text-warning bg-warning/10' : 'border-destructive text-destructive bg-destructive/10',
                  )}
                >
                  <Receipt className="h-3 w-3" />
                  {label}
                </Badge>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()} className="z-[210]">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground max-w-[260px]">{tip}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={link}>{chargeImported ? 'Attach to existing expense' : 'Link receipt'}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void notSame()}>Not the same</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DupFlagBadge({ recordKey, api, onChanged, className }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const flag = api.flagFor(recordKey);
  const self = api.byKey.get(recordKey);
  if (!flag || !self) return null;
  const other = flag.other;
  const where = other.source === 'business' ? 'in KCS Concepts'
    : other.source === 'qb_pending' ? 'in pending QuickBooks charges'
    : `on ${other.location}`;
  const label = flag.level === 'imported' ? 'Already imported' : 'Duplicate?';
  const tip = `${flag.level === 'medium' ? 'Possible duplicate' : flag.level === 'high' ? 'Likely duplicate' : 'Already imported'}: also ${where}, ${formatDisplayDate(other.date)}, ${money(other.amount)}`;

  const run = async (fn: () => Promise<void>, done: string) => {
    setBusy(true);
    try {
      await fn();
      toast({ title: done });
      onChanged?.();
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const selfWhere = self.source === 'business' ? 'KCS Concepts' : self.source === 'qb_pending' ? 'pending charges' : self.location;

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={busy}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn('inline-flex shrink-0', className)}
                aria-label={tip}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1 text-[10px] px-1.5 py-0 cursor-pointer whitespace-nowrap',
                    flag.level === 'medium'
                      ? 'border-warning text-warning bg-warning/10'
                      : 'border-destructive text-destructive bg-destructive/10',
                  )}
                >
                  <Copy className="h-3 w-3" />
                  {label}
                </Badge>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()} className="z-[210]">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground max-w-[260px]">{tip}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => run(() => api.dismiss(recordKey, other.key), 'Marked as not a duplicate')}>
          Not a duplicate
        </DropdownMenuItem>
        {flag.level === 'imported' ? (
          <DropdownMenuItem onSelect={() => {
            if (!window.confirm(`Remove ${money(self.amount)} (${formatDisplayDate(self.date)}) from pending? It is already ${where}.`)) return;
            void run(() => api.removeFromPending(self), 'Removed from pending');
          }}>
            Remove from pending
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => {
              if (!window.confirm(`Delete ${money(self.amount)} (${formatDisplayDate(self.date)}) from ${selfWhere}?`)) return;
              void run(() => api.deleteRecord(self), 'Deleted');
            }}
          >
            Delete this one
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface BannerProps {
  count: number;
  active: boolean;
  onToggle: () => void;
}

export function DuplicateBanner({ count, active, onToggle }: BannerProps) {
  if (count === 0 && !active) return null;
  return (
    <div className="flex items-center justify-between gap-3 border border-destructive/40 bg-destructive/5 px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <Copy className="h-4 w-4 text-destructive" />
        <span><span className="font-medium">{count}</span> possible {count === 1 ? 'duplicate' : 'duplicates'}</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'text-xs px-2 py-1 border transition-colors',
          active ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-border hover:border-destructive',
        )}
      >
        Duplicates
      </button>
    </div>
  );
}
