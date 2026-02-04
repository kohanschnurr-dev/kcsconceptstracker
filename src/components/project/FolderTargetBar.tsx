import { useDroppable } from '@dnd-kit/core';
import { Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentFolder {
  id: string;
  project_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

interface DroppableFolderChipProps {
  folder: DocumentFolder;
}

function DroppableFolderChip({ folder }: DroppableFolderChipProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-default",
        isOver 
          ? "bg-primary/20 border-primary ring-2 ring-primary scale-105" 
          : "bg-background border-border hover:border-primary/50"
      )}
    >
      <Folder className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-sm">{folder.name}</span>
    </div>
  );
}

function RootDropChip() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root-drop-zone',
    data: { type: 'root' },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-default",
        isOver 
          ? "bg-primary/20 border-primary ring-2 ring-primary scale-105" 
          : "bg-muted/50 border-border hover:border-primary/50"
      )}
    >
      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm">Root</span>
    </div>
  );
}

interface FolderTargetBarProps {
  folders: DocumentFolder[];
  currentFolderId: string | null;
  activeDragId: string | null;
}

export function FolderTargetBar({ folders, currentFolderId, activeDragId }: FolderTargetBarProps) {
  const otherFolders = folders.filter(f => f.id !== currentFolderId);
  
  // Only show when actively dragging a document
  if (!activeDragId) return null;
  
  // Show root option when inside a folder, show all folders when at root
  const showRoot = currentFolderId !== null;
  const hasTargets = otherFolders.length > 0 || showRoot;
  
  if (!hasTargets) return null;

  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-dashed border-primary/30 animate-in fade-in duration-200">
      <p className="text-xs text-muted-foreground mb-2">Move to:</p>
      <div className="flex flex-wrap gap-2">
        {showRoot && <RootDropChip />}
        {otherFolders.map(folder => (
          <DroppableFolderChip key={folder.id} folder={folder} />
        ))}
      </div>
    </div>
  );
}
