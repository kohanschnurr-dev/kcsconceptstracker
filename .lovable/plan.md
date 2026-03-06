

## Brighten All Orange Accents

The current orange sits at `36 100% 60%` (HSL) for the default theme and `32 45% 50%` for the Ember palette — both are muted. We'll push everything brighter and more vivid.

### Changes

**1. `src/index.css`** — Default CSS variables (`:root` and `.dark`)
- `--primary`: `36 100% 60%` → `30 100% 55%` (punchier, slightly deeper hue)
- `--accent`: `36 95% 58%` → `30 100% 55%`
- `--ring`, `--chart-1`, `--sidebar-primary`, `--sidebar-ring`: same update
- `.gold-glow` / `.gold-glow-sm` / `.blueprint-grid`: update hardcoded `hsl(38 100% 58%)` → `hsl(30 100% 55%)`

**2. `src/lib/colorPalettes.ts`** — Ember palette
- `--primary`: `32 45% 50%` → `30 100% 55%`
- `--accent`: `32 40% 45%` → `30 95% 52%`
- `--ring`, `--chart-1`, `--sidebar-primary`, `--sidebar-ring`: match primary

All other palettes (Graphite, Slate, etc.) are not orange-based, so no changes needed there.

