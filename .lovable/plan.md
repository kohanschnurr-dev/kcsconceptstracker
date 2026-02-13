

## Give Calendar & Add Buttons More Presence

### Problem
The calendar date-picker button and "Add" button in the Quick Task Input feel cramped and pushed to the far right, like afterthoughts.

### Solution
**File: `src/components/dashboard/QuickTaskInput.tsx`**

- Increase the calendar button size from `size="sm"` to `size="default"` (h-10) so it matches the input height
- Increase the Add button size from `size="sm"` to `size="default"` and add horizontal padding (`px-5`) so it feels more intentional
- Add `gap-3` instead of `gap-2` on the form container for slightly more breathing room between elements

This keeps the input as the primary element but gives the action buttons enough visual weight to not feel like afterthoughts.

