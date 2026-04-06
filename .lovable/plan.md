

## Plan: Make Calendar Legend Labels Black

**Problem**: The category legend labels (e.g., "Electrical", "Rough-ins") use `text-muted-foreground` which is too light to read easily.

### Change

**`src/components/calendar/CalendarLegend.tsx`** — Lines 10 and 15: Replace `text-muted-foreground` with `text-foreground` on both the category labels and the "Critical Path" label.

This makes all legend text black in light mode (white in dark mode) for maximum readability, while the colored dot swatches still communicate category identity.

