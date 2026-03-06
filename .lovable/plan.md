

## Fix Toggle UI + Brighten Orange Across Landing Page

### 1. Fix Annual/Monthly Toggle (`src/pages/Pricing.tsx`)
The toggle knob uses `bg-foreground` which makes it hard to see. Replace with a proper switch-style toggle:
- Use `bg-white` for the knob instead of `bg-foreground`
- Ensure the knob positioning works correctly for both states

### 2. Brighten Orange Primary Color (`src/index.css`)
Current primary: `32 95% 55%` (HSL ~#F5A623, but reads darker on dark bg). Bump lightness and saturation for a brighter, more vibrant orange:

- `--primary`: `36 100% 60%` (brighter golden orange)
- `--accent`: `36 95% 58%`
- `--ring`: `36 100% 60%`
- `--sidebar-primary`: `36 100% 60%`
- `--sidebar-ring`: `36 100% 60%`
- Same changes in the `.dark` block
- Update `--chart-1` to match

Also update the `gold-glow` and `gold-glow-sm` CSS utilities to use `38 100% 58%` for brighter glow effects.

### Files
- `src/index.css` — update all primary/accent/ring HSL values + gold-glow utilities
- `src/pages/Pricing.tsx` — fix toggle knob color to `bg-white`

