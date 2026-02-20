

## Fix Calendar Popover Glitch in Daily Logs Table

### Problem

When clicking the calendar icon to set a due date on a task row in the Daily Logs page, the calendar popover renders behind subsequent table rows. This happens because:

1. The table wrapper has `glass-card overflow-hidden` which uses `backdrop-blur-sm`, creating a stacking context
2. Even though Radix Popover uses a Portal, the visual layering gets confused with the backdrop-blur stacking context on the parent

### Fix

**`src/pages/DailyLogs.tsx`** -- Two locations (desktop table + mobile cards)

1. **Desktop table popover** (around line 1212): Add `z-[60]` to the `PopoverContent` for the due-date picker to ensure it renders above table rows with backdrop-blur stacking contexts. Also add `side="top"` so the calendar opens upward, avoiding clipping by the viewport bottom.

2. **Mobile card popover** (around line 1041): Same fix -- add `z-[60]` to the `PopoverContent`.

3. **Remove `overflow-hidden`** from the desktop table wrapper (line 1086): Change `glass-card overflow-hidden` to `glass-card overflow-x-auto` so horizontal overflow scrolls but vertical popover content isn't clipped during paint.

### Technical Details

- Line 1086: `className="hidden md:block glass-card overflow-hidden"` becomes `className="hidden md:block glass-card overflow-x-auto"`
- Line 1041: `<PopoverContent className="w-auto p-0" align="end">` becomes `<PopoverContent className="w-auto p-0 z-[60]" align="end" side="top">`
- Line 1212: `<PopoverContent className="w-auto p-0" align="end">` becomes `<PopoverContent className="w-auto p-0 z-[60]" align="end" side="top">`
- No database changes needed

