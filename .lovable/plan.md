
## Add Flat Cost vs $/sqft Pricing Mode to Category Presets

### What changes
Each preset category currently only supports a $/sqft rate. This update adds a pricing mode toggle so categories like HVAC can use a flat dollar amount that stays constant regardless of square footage.

### How it works
- Each preset gets a new `mode` field: either `"psf"` (per sqft, the default) or `"flat"`
- In the Edit Presets dialog, a new column header shows "Mode" with a toggle/select for each row
  - `psf` mode: shows "$/sqft" column, calculates `sqft x rate`
  - `flat` mode: shows "Flat $" column, uses the value as-is regardless of sqft
- Column headers update to: **Category | Mode | Amount | X**
- The auto-calculation logic updates so flat-mode presets always set their fixed amount when sqft changes (or on initial load), while psf presets multiply as before

### Technical Details

**File: `src/components/budget/BudgetCanvas.tsx`**

1. Update the `CategoryPreset` interface:
   ```typescript
   interface CategoryPreset {
     category: string;
     label: string;
     pricePerSqft: number;
     mode: 'psf' | 'flat'; // new field
   }
   ```

2. Update `DEFAULT_CATEGORY_PRESETS` to include `mode: 'psf'` on existing entries

3. In the sqft-change `useEffect` (line 104-117), update calculation logic:
   - `psf` mode: `sqftNum * preset.pricePerSqft` (existing behavior)
   - `flat` mode: `preset.pricePerSqft` directly (the value IS the flat cost)

4. Handle backward compatibility: when loading from localStorage, default missing `mode` to `'psf'`

5. Update the Edit Presets dialog:
   - Add a compact mode selector (Select dropdown or toggle) per row between Category and Amount columns
   - Column header changes from just "$/sqft" to show "Mode" and "Amount"
   - When mode is `flat`, the input placeholder shows "$" instead of "$/sqft"
   - New presets default to `psf` mode

6. Update the `addPreset` function to include `mode: 'psf'` as default
