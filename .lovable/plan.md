

## Fix Year Dropdown: Reduce Range to +/-3 Years, Add Scroll Constraint

### Problem
The year dropdown currently spans 20 years (±10), creating an excessively long unstyled native dropdown list that looks terrible (as shown in the screenshot).

### Solution
Two changes:

**1. `src/components/ui/calendar.tsx`** -- Change `fromYear` / `toYear` from ±10 to ±3:
- `fromYear={currentYear - 3}`
- `toYear={currentYear + 3}`

This limits the dropdown to ~7 years total, which is compact and practical for most use cases.

**2. `src/index.css`** -- Add a `max-height` and `overflow-y: auto` rule on the native `<select>` dropdown so that if it ever has more options than expected, it scrolls instead of stretching the full height:
```css
.calendar-dropdown {
  max-height: 200px;
  overflow-y: auto;
}
```

### Files Changed
- **Edit**: `src/components/ui/calendar.tsx` -- Change ±10 to ±3 year range
- **Edit**: `src/index.css` -- Add scroll constraint to `.calendar-dropdown`
