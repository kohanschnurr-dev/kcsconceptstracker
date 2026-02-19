

## Fix Calendar Legend Colors and Mobile Space

### Problem
1. **Invisible colors**: Legend swatches use `bg-blue-500/20` (20% opacity) -- nearly invisible on light palettes like Ivory
2. **Too much space**: The 2-column legend grid with 7 items eats vertical real estate on mobile

### Changes

**1. `src/lib/calendarCategories.ts`** -- Increase swatch opacity

Add a new `swatchClass` field to each category group with higher opacity for the legend dots (while keeping the existing low-opacity `bgClass` for task cards where subtlety is needed):

| Group | Current `bgClass` | New `swatchClass` |
|---|---|---|
| acquisition_admin | `bg-blue-500/20` | `bg-blue-500` |
| structural_exterior | `bg-red-500/20` | `bg-red-500` |
| rough_ins | `bg-orange-500/20` | `bg-orange-500` |
| inspections | `bg-purple-500/20` | `bg-purple-500` |
| interior_finishes | `bg-emerald-500/20` | `bg-emerald-500` |
| milestones | `bg-amber-500/20` | `bg-amber-500` |

Using solid colors for the small legend dots makes them clearly visible on both light and dark palettes.

**2. `src/components/calendar/CalendarLegend.tsx`** -- Use new swatch classes + compact mobile layout

- Use `swatchClass` instead of `bgClass` for the legend dot squares
- On mobile, switch to a horizontal scrollable row (`flex overflow-x-auto`) instead of a 2-column grid, so the legend takes only one line
- Keep the desktop layout as a wrapping flex row (unchanged behavior)

**3. `src/components/calendar/CalendarHeader.tsx`** -- No changes needed

The legend container already has minimal padding (`pt-1 border-t`). The CalendarLegend component itself becoming more compact will automatically fix the space issue.

### Result
- Legend dots become solid colors -- clearly visible on every palette (dark and light)
- Legend takes one horizontal scrollable line on mobile instead of a 4-row grid
- Task cards continue using subtle 20% opacity backgrounds (unchanged)

