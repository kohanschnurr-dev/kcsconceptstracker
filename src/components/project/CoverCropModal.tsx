import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Move } from 'lucide-react';

interface CoverCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (position: string) => void;
}

export function CoverCropModal({ open, onOpenChange, imageUrl, onSave }: CoverCropModalProps) {
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0, posX: 50, posY: 50 });

  // Reset position when modal opens with a new image
  useEffect(() => {
    if (open) {
      setPosX(50);
      setPosY(50);
    }
  }, [open, imageUrl]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY, posX, posY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [posX, posY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - startRef.current.x) / rect.width) * 100;
    const dy = ((e.clientY - startRef.current.y) / rect.height) * 100;
    // Invert: dragging right moves the visible area left (lower object-position %)
    setPosX(Math.max(0, Math.min(100, startRef.current.posX - dx)));
    setPosY(Math.max(0, Math.min(100, startRef.current.posY - dy)));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSave = () => {
    onSave(`${Math.round(posX)}% ${Math.round(posY)}%`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Position Cover Photo</DialogTitle>
          <DialogDescription>Drag the image to adjust how it appears on the project card.</DialogDescription>
        </DialogHeader>

        <div
          ref={containerRef}
          className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted cursor-grab active:cursor-grabbing select-none touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <img
            src={imageUrl}
            alt="Cover preview"
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectPosition: `${posX}% ${posY}%` }}
            draggable={false}
          />
          {/* Drag hint overlay */}
          {!isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <div className="flex items-center gap-2 bg-background/80 text-foreground text-sm px-3 py-1.5 rounded-full">
                <Move className="h-4 w-4" />
                Drag to reposition
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Position</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
