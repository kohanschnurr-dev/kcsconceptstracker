

## Add Color Palette Themes to Settings

A new "Color Palette" card on the Settings page that lets you switch between 5 professional dark-mode themes. The current orange/amber theme is preserved as the default, plus 4 new palettes. Selecting a theme instantly recolors the entire app.

### What You'll See

A new card (placed between Company Branding and Manage Sources) with 5 clickable theme preview tiles:

1. **Ember** (current) -- Orange/amber primary, dark slate background
2. **Ocean** -- Blue primary (#3B82F6), deep navy background
3. **Forest** -- Emerald/green primary (#10B981), dark charcoal background
4. **Amethyst** -- Purple/violet primary (#8B5CF6), dark plum-tinted background
5. **Steel** -- Cool neutral/silver primary (#94A3B8), pure dark background

Each tile shows a small color swatch strip (primary + accent + background) with the name below. The active theme gets a highlighted border ring.

### How It Works

- Clicking a palette updates CSS variables on `:root` via JavaScript (`document.documentElement.style.setProperty`)
- The selected palette key is saved to `localStorage` so it persists across sessions
- On app load, a small initializer reads from `localStorage` and applies the variables before React renders (prevents flash of wrong theme)

### Technical Details

**New files:**

- `src/lib/colorPalettes.ts` -- Defines the 5 palette objects, each mapping all CSS variable names to their HSL values (background, foreground, primary, secondary, muted, accent, border, input, ring, card, popover, sidebar variants, chart colors, success, warning, destructive). Exports `applyPalette(key)` which sets all CSS variables on `:root`, and `getActivePalette()` which reads from localStorage.

- `src/components/settings/ColorPaletteCard.tsx` -- The Settings card UI. Shows a grid of 5 palette preview swatches. Each swatch is a small rounded rectangle showing the palette's background, primary, and accent colors side by side. Active palette has a ring highlight. Clicking calls `applyPalette()` and saves to localStorage.

**Modified files:**

- `src/pages/Settings.tsx` -- Import and render `ColorPaletteCard` between Company Branding and Manage Sources.

- `src/index.css` -- The existing `:root` CSS variables stay as-is (they serve as the default/fallback). No structural changes needed since `style.setProperty` on `:root` overrides them.

- `src/main.tsx` -- Add a call to `applyPalette(getActivePalette())` before `createRoot` so the saved theme loads immediately on startup, preventing a flash of the default theme.

**Palette definitions (all dark mode):**

Each palette defines values for all ~30 CSS variables. The key differences per palette:

| Variable | Ember (current) | Ocean | Forest | Amethyst | Steel |
|----------|-----------------|-------|--------|----------|-------|
| --primary | 32 95% 55% | 217 91% 60% | 160 84% 39% | 263 70% 50% | 215 20% 65% |
| --accent | 32 90% 50% | 217 85% 55% | 160 80% 35% | 263 65% 45% | 215 15% 60% |
| --background | 220 20% 10% | 222 47% 9% | 160 20% 8% | 270 25% 9% | 220 15% 9% |
| --card | 220 18% 13% | 222 40% 12% | 160 15% 11% | 270 20% 12% | 220 12% 12% |
| --ring | 32 95% 55% | 217 91% 60% | 160 84% 39% | 263 70% 50% | 215 20% 65% |
| --sidebar-primary | 32 95% 55% | 217 91% 60% | 160 84% 39% | 263 70% 50% | 215 20% 65% |

All palettes keep the same foreground, muted-foreground, destructive, success, and warning values for consistency and readability.

**No database changes needed.** Theme preference is stored in localStorage.

