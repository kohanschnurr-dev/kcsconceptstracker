

## Remove Star Icon from Color Palette Card

### What Changes
Remove the star icon from the active palette card. The palette selection already persists via localStorage, so the chosen theme stays until the user explicitly changes it in settings. No persistence logic needs to change -- just remove the visual star.

### Technical Details

**File: `src/components/settings/ColorPaletteCard.tsx`**

1. Remove the `Star` import from `lucide-react`
2. Remove the conditional `{isActive && (<Star ... />)}` block inside the palette button

The active palette is still visually indicated by the `border-primary ring-2 ring-primary/30` styling on the selected card. The persistence via localStorage and `applyPalette`/`getActivePalette` already works correctly and requires no changes.

