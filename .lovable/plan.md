

## Plan: Improve Calendar Card Color Readability

The current category colors use very low-opacity backgrounds (`bg-X-500/20`) with generic `text-foreground`, producing washed-out cards that are hard to read — especially red and orange categories on a light background.

### Changes

**File: `src/lib/calendarCategories.ts`** — Update `CATEGORY_GROUPS` color definitions

Replace the current pastel-on-generic scheme with higher-contrast combinations:

| Group | Current bg | New bg | Current text | New text |
|-------|-----------|--------|-------------|----------|
| acquisition_admin (blue) | `bg-blue-500/20` | `bg-blue-50` | `text-foreground` | `text-blue-800` |
| structural_exterior (red) | `bg-red-500/20` | `bg-red-50` | `text-foreground` | `text-red-800` |
| rough_ins (orange) | `bg-orange-500/20` | `bg-orange-50` | `text-foreground` | `text-orange-800` |
| inspections (purple) | `bg-purple-500/20` | `bg-purple-50` | `text-foreground` | `text-purple-800` |
| interior_finishes (green) | `bg-emerald-500/20` | `bg-emerald-50` | `text-foreground` | `text-emerald-800` |
| milestones (amber) | `bg-amber-500/20` | `bg-amber-50` | `text-foreground` | `text-amber-800` |

Also update `borderClass` to use `-200` variants (e.g., `border-blue-200`) for a cleaner outline.

**For dark mode compatibility**, add dark-mode overrides:
- bg: `dark:bg-blue-500/20` (keep the current values as dark-mode variants)
- text: `dark:text-blue-200`
- border: `dark:border-blue-500/30`

This ensures cards are readable in both light and dark themes — solid pastels with strong text in light mode, translucent with light text in dark mode.

### Files
- `src/lib/calendarCategories.ts` (only file)

