

## Replace Inline Legend with Info Icon and Enlarge Month Label

### What Changes

Two visual tweaks to the Project Schedule calendar on the Project Detail page:

1. **Legend behind an "i" icon**: The color legend row currently takes up a full line. It will be replaced with a small info circle icon next to the title. Hovering or tapping it opens a popover showing the legend.

2. **Bigger month/year label**: The "February 2026" text is currently `text-sm` with `min-w-[120px]`. It will be bumped to `text-base font-semibold` with a wider min-width to match the main Calendar page.

### Changes

**`src/components/project/ProjectCalendar.tsx`**

1. **Import `Info`** from `lucide-react` (line 3).

2. **Replace the standalone `<CalendarLegend />` (line 172)** with an info icon popover placed next to the "Project Schedule" title (inside the Row 1 div, line 134-144):
   - Add a `Popover` with `PopoverTrigger` wrapping an `Info` icon (small, `h-4 w-4`, `text-muted-foreground hover:text-foreground`)
   - `PopoverContent` renders `<CalendarLegend />` inside it

3. **Enlarge the month label** (line 159): Change `labelClassName` from `"text-sm min-w-[120px] text-center"` to `"text-base font-semibold min-w-[150px] text-center"` so the month/year text is larger and more prominent.

### Technical Details

- Line 3: Add `Info` to the lucide-react import
- Lines 134-144: Insert the info popover next to the title text, before the `NewEventModal`
- Line 159: Update `labelClassName` prop on `MonthYearPicker`
- Line 172: Remove the standalone `<CalendarLegend />` line
- No database changes needed

