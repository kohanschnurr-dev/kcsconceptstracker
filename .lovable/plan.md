

## Reorganize Color Palette Layout

### Problem
All 10 color palettes are in a single horizontally-scrolling row, making it feel stretched and requiring scrolling to see all options.

### Solution
Switch from a horizontal scroll to a responsive **grid layout** -- 5 columns on desktop, 3 on smaller screens. Each palette swatch becomes more compact (smaller color preview, tighter padding). This eliminates scrolling and shows all palettes at a glance.

### Technical Details

**File: `src/components/settings/ColorPaletteCard.tsx`**

- Replace the `flex gap-3 overflow-x-auto` container with a `grid grid-cols-5 gap-2` layout (with `grid-cols-3` on small screens)
- Remove `min-w-[140px]`, `snap-center`, `flex-shrink-0`, and all horizontal scroll styling
- Reduce padding from `p-3` to `p-2` and color preview height from `h-10` to `h-8`
- Keep all existing selection logic and styling (border highlight, ring)

The result: a compact 2-row grid (5 per row) that fits entirely on screen without any scrolling.
