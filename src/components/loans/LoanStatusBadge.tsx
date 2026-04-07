import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LOAN_STATUS_CONFIG, LOAN_TYPE_LABELS } from '@/types/loans';
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
  return (
    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
      {LOAN_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}
