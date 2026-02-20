

## Replace Calendar Popovers with Clickable Due Date Cells

### What Changes

Remove the separate CalendarPlus icon buttons and their calendar popovers. Instead, make the "Due Date" text in each row clickable -- clicking it opens a date picker popover right there to set/change the due date.

### Changes

**`src/pages/DailyLogs.tsx`**

**Desktop table (around lines 1190-1228):**
1. Move the date picker Popover to wrap the Due Date cell content (lines 1192-1196) instead of living in the actions column (lines 1200-1228).
2. The due date text (or the "—" dash) becomes the `PopoverTrigger`. Styled as a clickable element with hover state (e.g., `cursor-pointer hover:text-primary underline-offset-2 hover:underline`).
3. Remove the CalendarPlus popover from the actions `TableCell` (lines 1199-1228).
4. Include a "Clear date" button inside the popover when a date is already set.
5. Only make it clickable when `task.status !== 'completed'`.

**Mobile cards (around lines 1022-1057):**
1. Same approach: make the "Due: MMM d, yyyy" text (line 1023-1025) the trigger for the date picker popover.
2. If no due date, show a small "Set date" link instead.
3. Remove the CalendarPlus button from the mobile action buttons (lines 1030-1057).

**Cleanup:**
- Remove `CalendarPlus` from the lucide-react import if no longer used elsewhere.

### Technical Details

- Lines 1192-1196 (desktop Due Date cell): Wrap content in `Popover` + `PopoverTrigger`, add `PopoverContent` with the `CalendarPicker` and "Clear date" button
- Lines 1200-1228 (desktop actions): Remove the CalendarPlus `Popover` block entirely
- Lines 1022-1026 (mobile due date display): Wrap in `Popover` + `PopoverTrigger`, add `PopoverContent`
- Lines 1030-1057 (mobile actions): Remove the CalendarPlus `Popover` block
- Line 2: Remove `CalendarPlus` from import
- Keep `z-[60]`, `side="top"`, and `pointer-events-auto` on all `PopoverContent` and `CalendarPicker` to maintain the fixes from earlier
- No database changes needed

