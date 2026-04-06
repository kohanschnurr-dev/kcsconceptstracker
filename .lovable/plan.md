

## Plan: Fix Category Color Dots to Use Dark, Readable Colors

**Problem**: The colored dots next to category items in the calendar dropdown use CSS `var(--red-500, red)` which falls back to basic CSS color names (`red`, `blue`, `orange`). These are washed-out browser default colors that are hard to read on white backgrounds.

**Fix**: Replace the dynamic `style` approach with the existing `swatchClass` from `CATEGORY_GROUPS`, which already uses proper Tailwind classes like `bg-red-500`, `bg-blue-500`, etc. These are bold, saturated colors.

### Changes — `src/components/calendar/NewEventModal.tsx`

1. **Line 351-354** — Replace the inline `style` on category item dots:
   - From: `style={{ backgroundColor: var(--${CATEGORY_GROUPS[groupKey].color}-500, ...) }}`
   - To: `className="w-2 h-2 rounded-full mr-2 ${CATEGORY_GROUPS[groupKey].swatchClass}"`

2. **Line 300-303** — Replace the inline `style` on the selected category dot in the trigger button:
   - From: `style={{ backgroundColor: var(--${selectedCategoryStyles.color}-500, ...) }}`
   - To: `className={cn("w-2 h-2 rounded-full", selectedCategoryStyles?.swatchClass)}`

Both changes switch from broken CSS custom properties to the existing Tailwind swatch classes (`bg-red-500`, `bg-blue-500`, `bg-orange-500`, `bg-purple-500`, `bg-emerald-500`, `bg-amber-500`) which render as bold, dark, readable colors.

### Files
- `src/components/calendar/NewEventModal.tsx` (2 line changes)

