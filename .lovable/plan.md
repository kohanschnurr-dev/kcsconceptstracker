
## Fix: Calendar Glitch in Daily Logs Due Date Picker

### Root Cause (Confirmed from Console Logs)

The browser console shows this exact error:

> `Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?`
> `Check the render method of DailyLogs.`
> `at Calendar`

The `Calendar` component in `src/components/ui/calendar.tsx` is defined as a plain `function Calendar(...)` — it does **not** use `React.forwardRef`. When Radix UI's `Popover` tries to pass a `ref` to it (which happens when `initialFocus` is set and the popover is inside a table cell `<td>`), React throws this warning and the component behavior becomes unpredictable — causing the visible glitch/freeze.

This is the known fix documented in the shadcn datepicker guidance: `pointer-events-auto` is already there, but the `Calendar` component itself needs to be wrapped with `React.forwardRef` so Radix can correctly attach the ref without errors.

### The Fix

**File: `src/components/ui/calendar.tsx`**

Wrap the `Calendar` function with `React.forwardRef` so it properly accepts the ref that Radix's Popover passes to it:

```typescript
// BEFORE
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  ...
}
Calendar.displayName = "Calendar";

// AFTER  
const Calendar = React.forwardRef<
  HTMLDivElement,
  CalendarProps
>(({ className, classNames, showOutsideDays = true, ...props }, _ref) => {
  ...
  return <DayPicker ... />;
});
Calendar.displayName = "Calendar";
```

This is a one-file, minimal change that fixes the ref warning at the source, which resolves the glitch in every calendar usage across the app (Daily Logs, Add Task modal, QuickTaskInput, etc.).

### Why This Fixes It

- Radix UI's `PopoverContent` internally tries to give a ref to its children for focus management
- Without `forwardRef`, React cannot pass the ref → throws the warning → causes rendering instability inside table rows → visible glitch
- With `forwardRef`, the ref is accepted cleanly (we just ignore it with `_ref` since `DayPicker` manages its own DOM), and Radix's focus management works correctly

### Files to Change

- `src/components/ui/calendar.tsx` — wrap `Calendar` with `React.forwardRef` (single change, ~5 lines affected)

### What Stays the Same

- All existing Calendar usage across the app continues to work identically
- No changes to `DailyLogs.tsx`, `AddTaskModal.tsx`, `QuickTaskInput.tsx`, or any other caller
- The `pointer-events-auto` class and all other props/classNames remain unchanged
