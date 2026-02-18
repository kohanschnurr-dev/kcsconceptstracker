
## Fix Profit Calculator Results Overflow on Mobile

### Problem

The three result cards (Est. Profit, Current Profit, ROI) in `ProfitCalculator.tsx` use:
- `grid grid-cols-3 gap-4` — fixed 3-column grid regardless of screen width
- `text-2xl font-bold font-mono` — large currency values like `$25,364` that don't fit in 1/3 of a narrow mobile screen
- `gap-4` — 16px gaps eat into already tight card space

On a 390px wide mobile screen, each card gets ~118px — not enough for `$25,364` in `text-2xl`.

### Solution

Two responsive changes in `src/components/project/ProfitCalculator.tsx`:

**1. Shrink the font size on mobile:**
Change `text-2xl` → `text-lg sm:text-2xl` on all three profit value paragraphs. This keeps large bold numbers on tablet/desktop while fitting on mobile.

**2. Reduce the gap on mobile:**
Change `gap-4` → `gap-2 sm:gap-4` on the grid container so cards have a bit more width on mobile.

**3. Reduce card padding on mobile:**
Change `p-4` → `p-2 sm:p-4` on all three result cards so content has more room to breathe inside narrow columns.

**4. Hide the TrendingUp icon on mobile for ROI card:**
The ROI value row uses `flex items-center justify-center gap-1` with a `TrendingUp` icon + `10.6%` text. On mobile the icon steals space — hide it with `hidden sm:inline`.

### Files to Modify

| File | Change |
|---|---|
| `src/components/project/ProfitCalculator.tsx` | 1. `gap-4` → `gap-2 sm:gap-4` on the grid. 2. `p-4` → `p-2 sm:p-4` on all 3 result cards. 3. `text-2xl` → `text-lg sm:text-2xl` on all 3 value paragraphs. 4. `hidden sm:block` on the `TrendingUp` icon in the ROI card. |

### Technical Snippet

```tsx
// Grid container
<div className="grid grid-cols-3 gap-2 sm:gap-4">

// Each result card
<div className={cn(
  "p-2 sm:p-4 rounded-lg text-center cursor-pointer ...",
  ...
)}>

// Currency values (Est. Profit & Current Profit)
<p className={cn(
  "text-lg sm:text-2xl font-bold font-mono",
  ...
)}>

// ROI value + icon
<p className={cn(
  "text-lg sm:text-2xl font-bold font-mono flex items-center justify-center gap-1",
  ...
)}>
  <TrendingUp className="hidden sm:block h-5 w-5" />
  {roi.toFixed(1)}%
</p>
```

No logic changes — purely responsive styling.
