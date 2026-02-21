

## Left-Align Input Values in Profit Calculator

### Problem

The numeric inputs (Purchase Price, ARV, Transaction Costs, Holding Costs) have a `DollarSign` icon on the left with `pl-9` padding, pushing the values away from the left edge unnecessarily.

### Solution

Remove the `DollarSign` icons and the `pl-9` padding class from all four input fields so values sit flush-left inside the inputs. The labels already indicate these are dollar amounts, making the icons redundant.

### Changes

**`src/components/project/ProfitCalculator.tsx`**

- Remove the `<DollarSign>` icon elements inside the `relative` wrappers for Purchase Price and ARV fields
- Remove the `className="pl-9"` from those two `<FormulaInput>` components
- Also remove the conditional `DollarSign` icon and `pl-9` from the Transaction Costs and Holding Costs fields (flat mode)
- Clean up unused `DollarSign` import if no longer needed elsewhere in the component

### Files Changed
- `src/components/project/ProfitCalculator.tsx` -- remove dollar icons and left padding from 4 input fields

