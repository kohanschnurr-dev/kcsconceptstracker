

## Widen the Calendar Legend and Increase Text Size

### What Changes
The category legend bar below the calendar header will be made taller with larger text and color swatches so everything is easier to read at a glance.

### Technical Details

**File: `src/components/calendar/CalendarLegend.tsx`**

- Increase text size from `text-xs` to `text-sm`
- Increase color swatch size from `w-3 h-3` to `w-3.5 h-3.5`
- Increase gap between legend items from `gap-3` to `gap-4`
- Increase gap between swatch and label from `gap-1.5` to `gap-2`

**File: `src/pages/Calendar.tsx`**

- Increase padding on the legend container from `p-3` to `p-4`

Two small edits across two files. The legend will be noticeably more readable without changing layout or breaking anything.

