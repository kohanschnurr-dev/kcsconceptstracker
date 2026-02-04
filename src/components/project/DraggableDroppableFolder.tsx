import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Folder, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DocumentFolder {
  id: string;
  project_id: string;
  name: string;
  color: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DraggableDroppableFolderProps {
  folder: DocumentFolder;
  documentCount: number;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export function DraggableDroppableFolder({ 
  folder, 
  documentCount, 
  onClick, 
  onDelete,
  onRename 
}: DraggableDroppableFolderProps) {
  // Make folder droppable (can receive documents and other folders)
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id },
  });

  // Make folder draggable (can be moved into other folders)
  const { 
    attributes, 
    listeners, 
    setNodeRef: setDraggableRef, 
    transform, 
    isDragging 
  } = useDraggable({
    id: `drag-folder-${folder.id}`,
    data: { type: 'folder', folder },
  });

  // Combine refs for both draggable and droppable
  const setNodeRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Only trigger click if not dragging
        if (!isDragging) {
          onClick();
        }
      }}
      className={cn(
        "group relative rounded-xl border border-border/30 bg-card hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden",
        isDragging && "shadow-2xl ring-2 ring-primary cursor-grabbing",
        !isDragging && "cursor-grab",
        isOver && !isDragging && "ring-2 ring-primary border-primary bg-primary/5 scale-105"
      )}
    >
      {/* Folder Icon Area */}
      <div className="flex flex-col items-center justify-center py-6 px-4 bg-amber-500/10">
        <Folder className={cn(
          "h-12 w-12 text-amber-500 transition-transform",
          isOver && !isDragging && "scale-110"
        )} />
      </div>

      {/* Info Area */}
      <div className="p-3 space-y-1">
        <p className="font-medium text-sm truncate" title={folder.name}>
          {folder.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {documentCount} {documentCount === 1 ? 'file' : 'files'}
        </p>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()} // Prevent drag from starting
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Drop indicator overlay */}
      {isOver && !isDragging && (
        <div className="absolute inset-0 bg-primary/10 pointer-events-none flex items-center justify-center">
          <span className="text-sm font-medium text-primary">Drop here</span>
        </div>
      )}
    </div>
  );
}
