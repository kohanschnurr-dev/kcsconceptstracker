

## Plan: Per-Category $/PSF Toggle on Budget Calculator

Each budget category card currently has only a flat dollar input. This adds a tiny toggle on each card so users can switch between entering a flat dollar amount or a $/PSF (per square foot) rate. When in PSF mode, the entered rate is multiplied by the project's sqft to compute the actual budget value.

### Changes

**`src/components/budget/BudgetCategoryCard.tsx`**
- Add `sqft` prop (string) passed down from the canvas
- Add local state `isPsf` (boolean, default false) tracking the input mode per card
- Persist PSF mode selections in localStorage (`budget-psf-modes`) as a `Record<string, boolean>` keyed by category
- Add a small clickable toggle button between the label and the input showing either `$/sf` or `$` — clicking it switches modes
- When in PSF mode:
  - Show the input prefixed with `$/sf` instead of `$`
  - Store the PSF rate in local state; on change, multiply by sqft and call `onChange` with the computed flat amount
  - Back-calculate the PSF rate from the current value when switching into PSF mode (value / sqft)
- When in flat `$` mode: behave exactly as today

**`src/components/budget/BudgetCanvas.tsx`**
- Pass the existing `sqft` prop through to every `<BudgetCategoryCard>` instance (approx 3 render sites across category/timeline/costtype views)

### UI Details
- Toggle is a tiny pill/chip (`text-[9px]`, `px-1`, `h-5`) positioned to the left of the input, styled with `bg-muted hover:bg-muted-foreground/20 rounded cursor-pointer`
- Active PSF mode shows the pill highlighted with `bg-primary/20 text-primary`
- Input width stays at `w-20`; the PSF rate naturally fits (e.g., "4" for $4/sqft)
- When sqft is 0 or empty, PSF toggle is hidden (can't calculate)

### Files
- `src/components/budget/BudgetCategoryCard.tsx`
- `src/components/budget/BudgetCanvas.tsx`

