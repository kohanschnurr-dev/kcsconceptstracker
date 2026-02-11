

## Color Palette: Horizontal Slider + Remove Forest

### Changes

**1. Remove the Forest palette**
- Delete the "forest" entry from `src/lib/colorPalettes.ts`
- Remove `'forest'` from the `PaletteKey` type union
- If the user's saved palette is "forest", fall back to "ember"

**2. Convert grid to horizontal scrollable slider**
- In `src/components/settings/ColorPaletteCard.tsx`, replace the `grid` layout with a horizontal flex container that scrolls
- Use `overflow-x-auto` with hidden scrollbar styling and `snap-x` for smooth snapping
- Each palette tile becomes a fixed-width card so they flow horizontally
- On mobile, users swipe; on desktop, they can scroll or use natural overflow

### Technical Details

**File: `src/lib/colorPalettes.ts`**
- Remove `'forest'` from `PaletteKey` type (becomes `'ember' | 'ocean' | 'amethyst' | 'steel'`)
- Delete the entire forest palette object from the `palettes` array
- In `getActivePalette()`, add a check: if stored value is `'forest'`, return `'ember'` instead

**File: `src/components/settings/ColorPaletteCard.tsx`**
- Replace the outer `div` with `grid` classes with a horizontal scroll container:
  - `flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide`
- Each palette button gets `min-w-[140px] snap-center flex-shrink-0` so tiles stay a consistent size and scroll smoothly
- Add a CSS utility class `scrollbar-hide` (using Tailwind's built-in or a small inline style) to hide the scrollbar for a cleaner look

