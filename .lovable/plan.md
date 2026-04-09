

## Center Tab Triggers to 1/4 Width

### Problem
The tab triggers (Overview, Amortization, Draws, Payments) currently use `flex-1` which stretches them across the full bar. They should each take up exactly 1/4 of the bar width, centered.

### Change

**`src/pages/LoanDetail.tsx`** (~lines 156-161)

Update the `TabsList` to center its children and give each trigger a fixed 1/4 width:

- Change `TabsList` className from `"w-full"` to `"w-full justify-center"`
- Change each `TabsTrigger` className from `"flex-1"` to `"w-1/4"`

This matches the pattern used elsewhere in the app for evenly-spaced centered tabs.

