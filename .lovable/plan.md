

## Clean Up Calendar Mobile UI

The current mobile calendar header crams too many elements into tight rows, making the month navigation and calendar icon feel tiny. Here's the redesign:

### Current Issues (from screenshot)
- "Project Calendar" title with tiny calendar icon feels cramped on Row 1
- Month navigation (February 2026) + "All Projects" filter squeezed together on Row 2
- The legend section takes up a lot of vertical space as a separate card

### Proposed Mobile Layout (3 rows)

**Row 1**: "Project Calendar" title (larger icon) | View selector + Add button (unchanged)

**Row 2**: Month navigation centered, full width -- chevrons + month/year picker spread out with more breathing room

**Row 3**: Project filter, full width

**Legend**: Merge the legend INTO the header card on mobile (remove the separate bordered card) to reduce vertical sections. On desktop, keep it separate.

### Technical Changes

**1. `src/components/calendar/CalendarHeader.tsx`** -- Mobile layout (lines 81-148)

- Increase calendar icon from `h-4 w-4` to `h-5 w-5`
- Increase title text from `text-sm` to `text-base`
- Split Row 2 into two rows:
  - New Row 2: Month navigation centered with `justify-center` and larger touch targets (`h-8 w-8` chevrons)
  - New Row 3: Project filter as full-width standalone row
- Add CalendarLegend component inside the mobile header card (after Row 3)

**2. `src/pages/Calendar.tsx`** -- Legend section (lines 253-256)

- Hide the separate legend card on mobile: change wrapping div to `hidden sm:block bg-background rounded-lg p-4 border border-border`
- This avoids duplicate legends since mobile will show it inside the header

**3. `src/components/calendar/CalendarLegend.tsx`** -- No changes needed, already responsive

### Result
- Larger, more readable title and icon
- Month navigation has full width and bigger tap targets
- Project filter gets its own full-width row instead of being squeezed
- Legend integrated into header card on mobile, reducing visual sections from 3 boxes to 2

