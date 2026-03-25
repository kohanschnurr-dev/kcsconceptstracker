

## Plan: Persist Cash Flow Toggle States

### Problem
The Yr/Mo period toggles (for taxes, insurance, HOA, maintenance) and the Construction Budget mode (Budget/Spent/Manual) reset to defaults on page reload because they aren't saved to the database.

### Changes

**1. Database Migration — add 5 columns to `projects`**

```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS cashflow_rehab_mode text DEFAULT 'budget',
  ADD COLUMN IF NOT EXISTS cashflow_tax_period text DEFAULT 'year',
  ADD COLUMN IF NOT EXISTS cashflow_insurance_period text DEFAULT 'year',
  ADD COLUMN IF NOT EXISTS cashflow_hoa_period text DEFAULT 'year',
  ADD COLUMN IF NOT EXISTS cashflow_maintenance_period text DEFAULT 'month';
```

All nullable text columns with sensible defaults matching current UI defaults.

**2. `src/components/project/CashFlowCalculator.tsx`**

- Add 5 new props: `initialRehabMode`, `initialTaxPeriod`, `initialInsurancePeriod`, `initialHoaPeriod`, `initialMaintenancePeriod`
- Initialize the corresponding state from these props instead of hardcoded defaults
- In `handleSave`, include the 5 new columns in the update call
- In the `useEffect` reset block, restore these states from props

**3. `src/pages/ProjectDetail.tsx`**

- Pass the 5 new props from the project record to `CashFlowCalculator`

### Technical Details

- `rehabMode` initialization: if `initialRehabMode` is provided use it, else fall back to existing logic (`initialRehabOverride != null ? 'manual' : 'budget'`)
- Period fields map directly: `'year'` ↔ `'year'`, `'month'` ↔ `'month'`
- Save uses `as any` cast (already in use) to handle columns not yet in generated types

