import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LOAN_STATUS_CONFIG, LOAN_TYPE_LABELS, LOAN_TYPE_COLORS } from '@/types/loans';
import type { LoanStatus, LoanType } from '@/types/loans';

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const cfg = LOAN_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

export function LoanTypeBadge({ type }: { type: LoanType }) {
  const c = LOAN_TYPE_COLORS[type] ?? LOAN_TYPE_COLORS.other;
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', c.badge)}>
      {LOAN_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}

export function LoanPurposeBadge({ purpose }: { purpose: string | null | undefined }) {
  const c = getLoanPurposeColor(purpose);
  const label = purpose?.trim() || '—';
  return (
    <Badge variant="outline" className={cn('text-xs font-medium whitespace-nowrap', c.badge)}>
      {label}
    </Badge>
  );
}

