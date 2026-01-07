import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  onClick: () => void;
  className?: string;
}

export function QuickActionButton({ onClick, className }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'quick-action-btn animate-pulse-glow',
        className
      )}
      aria-label="Quick log expense"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
