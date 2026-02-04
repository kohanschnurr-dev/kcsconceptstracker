import { useDroppable } from '@dnd-kit/core';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RootDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root-drop-zone',
    data: { type: 'root' },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-full border-2 border-dashed rounded-lg p-4 transition-all flex items-center justify-center gap-2",
        isOver 
          ? "border-primary bg-primary/10 text-primary" 
          : "border-border/50 text-muted-foreground"
      )}
    >
      <ArrowUp className="h-4 w-4" />
      <span className="text-sm font-medium">
        {isOver ? "Release to move to root" : "Drag here to move out of folder"}
      </span>
    </div>
  );
}
