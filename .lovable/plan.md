

## Plan: Rename "Filler" to "Contingency" + Include in Clipboard Export

### Changes

**1. `src/types/index.ts` (line 247)**
- Change label from `'Filler'` to `'Contingency'`

**2. `src/components/budget/TemplatePicker.tsx` (line 238)**
- Remove `k !== 'rehab_filler'` from the filter so Contingency is included in the TSV clipboard export

**3. `src/pages/BudgetCalculator.tsx` (line 249)**
- Update toast message from `"allocated to Filler"` to `"allocated to Contingency"`

**4. `src/lib/csvImportUtils.ts` (line 117)**
- Replace `Filler` with `Contingency` in the AI prompt's category list

4 files, 4 one-line changes.

