

## Add Month/Year Toggle for Property Taxes and HOA

### What Changes
Replace the labels "Property Taxes/yr" and "HOA/yr" with just "Property Taxes" and "HOA", each with a small month/year toggle button. Users can independently choose whether they're entering a monthly or yearly amount for each field. The stored value in the database remains annual -- if the user enters a monthly amount, it gets multiplied by 12 before saving and calculating.

### Technical Details

**File: `src/components/project/CashFlowCalculator.tsx`**

1. **Add two state variables** for the toggle mode:
   - `taxPeriod: 'month' | 'year'` (default `'year'`)
   - `hoaPeriod: 'month' | 'year'` (default `'year'`)

2. **Update labels** from "Property Taxes/yr" and "HOA/yr" to just "Property Taxes" and "HOA"

3. **Add a small toggle button** next to each label showing "/mo" or "/yr" that switches on click -- styled as a compact pill or inline button

4. **Adjust display values**: When toggled to monthly, display `annualPropertyTaxes / 12` in the input; when yearly, display the raw annual value

5. **Adjust input handling**: When the user types a value in monthly mode, store `value * 12` into the annual state variable so all downstream calculations remain unchanged

6. **No database changes needed** -- the stored values stay as annual amounts, the toggle is purely a UI convenience

### UI Layout (per field)

```text
Property Taxes  [/yr]      HOA  [/mo]
[$  0         ]            [$  380    ]
```

The toggle is a small clickable badge/button right next to the label text.

