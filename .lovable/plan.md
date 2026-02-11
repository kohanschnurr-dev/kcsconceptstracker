

## Replace Current Palettes with Sleek, Professional Themes

### What changes
Replace the existing 8 palettes with refined, muted, professional color schemes. The current ones use highly saturated primary colors (bright orange, blue, red, purple) that feel playful. The new set will use desaturated, sophisticated tones with subtle accent colors -- think executive dashboard, not candy store.

### New Palette Lineup

| Name | Primary Accent | Vibe |
|------|---------------|------|
| **Ember** (keep, refined) | Warm amber, slightly desaturated | Original default, toned down |
| **Graphite** (replaces Steel) | Cool neutral gray-blue | Minimal, monochrome pro |
| **Slate** (replaces Ocean) | Muted steel-blue | Corporate calm |
| **Onyx** (replaces Midnight) | Deep indigo, low sat | Near-black elegance |
| **Sage** (replaces Teal) | Muted olive-green | Earthy, grounded |
| **Bronze** (replaces Copper) | Dark warm bronze | Luxury feel |
| **Charcoal** (replaces Crimson) | Warm dark gray with subtle rose | Understated warmth |
| **Cobalt** (replaces Amethyst) | Deep desaturated blue | Classic professional |

### Key Design Principles
- Primary colors at 30-50% saturation (current ones are 70-95%)
- Backgrounds stay very dark (8-11% lightness) for the app's dark-mode aesthetic
- Accent colors are muted but still distinguishable
- No bright reds, purples, or candy-colored tones

### Technical Details

**File: `src/lib/colorPalettes.ts`**
- Update the `PaletteKey` type to: `'ember' | 'graphite' | 'slate' | 'onyx' | 'sage' | 'bronze' | 'charcoal' | 'cobalt'`
- Replace palette definitions with new desaturated HSL values
- Add migration in `getActivePalette()` to map old keys to `'ember'` fallback
- Each palette keeps the same variable structure, just with refined HSL values

**File: `src/components/settings/ColorPaletteCard.tsx`**
- No structural changes needed -- it reads from the palettes array dynamically

