import { useSortable } from '@dnd-kit/sortable';
import { TabsTrigger } from '@/components/ui/tabs';
import { GripVertical } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SortableTabProps {
  id: string;
  value: string;
  label: string;
  icon: LucideIcon;
  count: number;
}

export function SortableTab({ id, value, label, icon: Icon, count }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <TabsTrigger value={value} className="gap-1.5 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-3 w-3 text-muted-foreground/50" />
        <Icon className="h-4 w-4" />
        {label} ({count})
      </TabsTrigger>
    </div>
  );
}
