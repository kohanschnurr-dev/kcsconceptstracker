

## Move Gear Icon Away from Close Button

### Problem
The gear (Settings) icon sits at the far right of the header via `justify-between`, placing it right next to the dialog's built-in X close button.

### Solution
Move the gear icon to sit inline next to the "Operation Rules" title text instead of being pushed to the far right. This gives clear visual separation from the X button.

**File: `src/components/ops/RulesPopout.tsx` (lines 164-169)**

Change the header layout from `justify-between` (which pushes the gear to the right edge) to a simple `gap-2` flex container where the gear sits right after the title:

```tsx
// Before
<div className="flex items-center justify-between">
  <DialogTitle>Operation Rules</DialogTitle>
  <Button variant="ghost" size="icon" className="h-7 w-7" ...>

// After
<div className="flex items-center gap-2">
  <DialogTitle>Operation Rules</DialogTitle>
  <Button variant="ghost" size="icon" className="h-7 w-7" ...>
```

This places the gear icon immediately after the title text with a small gap, well away from the X close button.

