

## Fix: Recalculate Filler When Sqft Changes After Baseline Selection

### Problem
When a user selects a baseline template (e.g., "Overhaul $65/sqft") **before** entering square footage, the budget is calculated as `0 * $65 = $0` and nothing is placed in Filler. When sqft is later entered, nothing triggers a recalculation -- the Filler stays empty.

### Solution
Track the currently selected baseline tier so that when sqft changes, the Filler category can be recalculated automatically.

### Technical Changes

**File: `src/pages/BudgetCalculator.tsx`**

1. Add a new state to remember the active baseline tier rate:
   - `const [activeBaselineRate, setActiveBaselineRate] = useState<number | null>(null);`

2. Update `handleSelectTemplate` to detect baseline templates and store their rate:
   - Baseline template IDs start with `"baseline-"` -- when one is selected, extract the per-sqft rate from `template.total_budget / template.sqft` (or pass the rate through the template object)
   - When a saved (non-baseline) template is selected, clear the active rate (`setActiveBaselineRate(null)`)

3. Add a `useEffect` that watches `sqft` and `activeBaselineRate`:
   - When both have values, recalculate `rehab_filler = sqft * activeBaselineRate`
   - Update `categoryBudgets` with the new filler value
   - This ensures typing/changing sqft immediately updates the Filler amount

4. Clear `activeBaselineRate` on "Start Blank" / `handleClearAll`

**File: `src/components/budget/TemplatePicker.tsx`**

5. Pass the tier's `pricePerSqft` through the template object so `BudgetCalculator` can store it:
   - Add a field to the template object in `handleBaselineSelect`, e.g., set `description` to include the rate, or add a convention like storing the rate in a known place
   - Simplest approach: use a naming convention in the template ID (already `baseline-{name}`) and pass the rate as part of `total_budget` and `sqft` -- the parent can derive it as `total_budget / sqft`

### How it works after the fix
1. User clicks "Overhaul" baseline (sqft is empty) -- template is applied with $0 filler, but the $65/sqft rate is remembered
2. User types "1200" in sqft field -- the effect fires, calculates `1200 * 65 = $78,000`, and puts it in Filler
3. User changes sqft to "1500" -- Filler updates to `1500 * 65 = $97,500`
4. User selects "Start Blank" -- rate is cleared, filler is cleared
