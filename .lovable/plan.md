

## More Palettes + Fix Hover Glitch

### 1. Fix the hover glitch

The `hover:scale-105` on palette buttons causes layout jitter inside the scrollable flex container -- scaling pushes siblings around and triggers scroll reflow. Fix by removing the scale transform and using a subtler hover effect instead (border color change + slight shadow lift).

**File: `src/components/settings/ColorPaletteCard.tsx`**
- Remove `hover:scale-105` from the button className
- Replace with `hover:shadow-md hover:shadow-primary/10` for a clean lift effect without layout shift
- Add `transition-all duration-150` for smooth feel

### 2. Add more palettes

Add 4 new professional dark-mode themes to `src/lib/colorPalettes.ts`:

| Name | Primary Color | Vibe |
|------|--------------|------|
| **Crimson** | Red 0 85% 50% | Bold, warm red accent |
| **Teal** | Cyan-teal 180 70% 40% | Fresh, modern teal |
| **Copper** | Warm brown 25 70% 45% | Earthy, sophisticated |
| **Midnight** | Deep indigo 235 60% 55% | Rich, deep blue-violet |

**File: `src/lib/colorPalettes.ts`**
- Add `'crimson' | 'teal' | 'copper' | 'midnight'` to the `PaletteKey` type
- Add 4 new palette objects following the same structure as existing ones (background, card, primary, secondary, muted, accent, border, input, ring, chart colors, sidebar variants)
- Each palette keeps the shared foreground/status colors for consistency

### Files changed

- `src/lib/colorPalettes.ts` -- add 4 palettes, update type
- `src/components/settings/ColorPaletteCard.tsx` -- fix hover effect

