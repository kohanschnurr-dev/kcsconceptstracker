

## Enable Formula Input in Profit Calculator

### Problem

The Profit Calculator component (`src/components/project/ProfitCalculator.tsx`) was missed during the FormulaInput rollout. It still uses plain `<Input type="number">` fields, which block the `=` character needed to start a formula.

### Changes

**`src/components/project/ProfitCalculator.tsx`**

Replace all four `<Input type="number">` fields with `<FormulaInput type="number">`:

1. **Purchase Price** (line ~159) -- swap `Input` to `FormulaInput`
2. **ARV** (line ~173) -- swap `Input` to `FormulaInput`
3. **Transaction Costs** (line ~191) -- swap `Input` to `FormulaInput`
4. **Holding Costs** (line ~209) -- swap `Input` to `FormulaInput`

Add the import at the top:
```tsx
import { FormulaInput } from '@/components/ui/formula-input';
```

No other logic changes needed -- `FormulaInput` is a drop-in replacement that accepts the same props.

### Files Changed
- `src/components/project/ProfitCalculator.tsx` -- swap 4 Input fields to FormulaInput, add import

