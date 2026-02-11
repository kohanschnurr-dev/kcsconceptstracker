

## Fix: Show blank instead of "0" in editable percentage inputs

### Problem
When the closing/holding cost percentage inputs show `0`, you can't clear the field to type a new number -- the `0` stays and you end up with values like `03`.

### Solution
Apply the same UX pattern already used throughout the app for numeric inputs: display an empty string when the value is `0`.

### Technical Details

**File: `src/components/project/ProfitCalculator.tsx`**

Update the two inline `<input>` elements for `closingPct` and `holdingPct`:

- Change `value={closingPct}` to `value={closingPct || ''}`
- Change `value={holdingPct}` to `value={holdingPct || ''}`

This matches the existing pattern used for Purchase Price and ARV inputs in the same component (`value={purchasePrice || ''}`, `value={arv || ''}`).

Two lines changed, no other files affected.

