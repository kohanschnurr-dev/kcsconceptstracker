

## Fix Date and Amount Layout on Mobile

The Amount and Date fields are currently in a `grid grid-cols-2 gap-4` layout (line 283 of `QuickExpenseModal.tsx`). On mobile screens, this makes both fields too narrow -- the date picker gets squeezed and the amount input is cramped.

### Change

**File: `src/components/QuickExpenseModal.tsx`** (line 283)

Change the Amount/Date row from always being 2 columns to stacking vertically on mobile:

- Change `grid grid-cols-2 gap-4` to `grid grid-cols-1 sm:grid-cols-2 gap-4`

This makes Amount and Date each take full width on mobile (stacked), and sit side-by-side on larger screens.

### Technical Detail

Single class change on line 283:
```
- <div className="grid grid-cols-2 gap-4">
+ <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

Only the Amount/Date row is affected. The Project/Category and Vendor/Payment rows will remain as 2-column grids since they work fine at that width.

