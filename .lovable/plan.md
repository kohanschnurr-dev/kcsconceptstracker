

## Fix "Set as Cover" Glitchy UI on Mobile

### Problems

1. **"Set as Cover" button uses hover-only visibility** (`opacity-0 group-hover:opacity-100`). On mobile, there's no hover -- tapping triggers a sticky hover state that looks glitchy and inconsistent. Some photos show the button, others don't.

2. **The Cover Crop Modal uses a Dialog**, which on mobile can appear cramped or partially offscreen. It should use a Drawer (bottom sheet) on mobile, consistent with other modals in the app.

### Changes

**`src/components/project/PhotoGallery.tsx`** (lines 412-424)

Replace the hover-only "Set as Cover" button with an always-visible button on mobile:
- Change from `opacity-0 group-hover:opacity-100` to `sm:opacity-0 sm:group-hover:opacity-100` so it's always visible on mobile but hover-revealed on desktop.
- Make the button smaller and more subtle on mobile so it doesn't dominate the photo tile.

**`src/components/project/CoverCropModal.tsx`**

Use a Drawer on mobile, Dialog on desktop (same pattern as the Edit Task dialog):
- Import `useIsMobile` from `@/hooks/use-mobile`
- Import `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerFooter` from vaul
- Extract the crop content (image preview + drag area + buttons) into a shared variable
- Conditionally render Drawer or Dialog based on screen size

### Technical Details

- `useIsMobile()` from `@/hooks/use-mobile` returns true below 768px
- The pointer-based drag logic works the same in both Drawer and Dialog since it uses `onPointerDown/Move/Up` with `touch-none`
- The Drawer component is already installed (vaul)
- No database changes needed
