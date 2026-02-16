

## Fix Truncated Project Name in Calendar Header

### Problem
The project filter trigger is set to a fixed `w-[180px]`, which is too narrow for real project names (e.g., "2500 Prosperity Ln" shows as "2500 Prosp...").

### Solution

**File: `src/components/calendar/CalendarHeader.tsx`** (line 114)

Change the trigger width from `w-[180px]` to `w-[220px]`. This gives enough room for typical project names (street addresses) to display without truncation, while still fitting comfortably in the header row alongside the other controls.

```
triggerClassName="h-9 w-[220px] bg-card border-border text-foreground hover:bg-secondary"
```

### Files Changed
- `src/components/calendar/CalendarHeader.tsx` (one width change)
