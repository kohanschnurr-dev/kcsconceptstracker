

## Replace Sage, Bronze, and Charcoal with 3 New Professional Palettes

### What's changing
Remove **Sage**, **Bronze**, and **Charcoal** and replace them with:

| Name | Primary Accent | Vibe |
|------|---------------|------|
| **Ivory** | Warm neutral gold on light background | Clean, light/white professional theme |
| **Titanium** | Cool silver-white accent on mid-dark gray | Industrial, modern, neutral |
| **Midnight** | Deep navy with crisp teal accent | Premium dark corporate |

### Design Details

**Ivory (the "white" palette)**
- Light backgrounds (90-95% lightness) with dark text
- Subtle warm gold accent (low saturation)
- Foreground/text colors inverted to dark tones for readability on white
- Cards slightly off-white for depth

**Titanium**
- Medium-dark neutral gray backgrounds (no color tint)
- Silver/steel accent with minimal saturation
- Very clean, monochrome feel

**Midnight**
- Very dark navy-blue backgrounds
- Crisp but desaturated teal-cyan accent
- Deep, premium feel

### Technical Changes

**File: `src/lib/colorPalettes.ts`**
- Update `PaletteKey` type: replace `'sage' | 'bronze' | 'charcoal'` with `'ivory' | 'titanium' | 'midnight'`
- Replace the three palette objects with new definitions
- Ivory will need its own foreground/text overrides (dark text on light bg) rather than using the shared dark-mode defaults
- Update `OLD_KEY_MAP` to map `sage -> ivory`, `bronze -> titanium`, `charcoal -> midnight` (plus keep existing `crimson -> midnight`, `teal -> ivory`, `copper -> titanium` mappings)

**File: `src/index.css`** -- No changes needed (CSS vars are set dynamically)

**File: `src/components/settings/ColorPaletteCard.tsx`** -- No changes needed (reads palettes array dynamically)

