
## Add Contractor Projects to Profit Potential

### Overview
The Profit Potential page (`/profit`) and Dashboard Preferences currently only handle `fix_flip`, `rental`, `new_construction`, and `wholesaling`. Contractor projects use a fundamentally different financial model — **Gross Profit = Contract Value − Job Cost** (no ARV) — so they need special-cased handling throughout the pipeline.

---

### What Needs to Change

#### 1. `src/pages/ProfitBreakdown.tsx`

**Constants & Types**
- Add `'contractor'` to `ALL_TYPES` array.
- Add `{ value: 'contractor', label: 'Contractor' }` to `TYPE_OPTIONS`.
- Extend `ProjectProfit` interface with an optional `isContractor: boolean` flag and `contractValue` field.

**Data Fetching (`fetchData`)**
- Contractor projects currently fall into `unconfiguredList` because they have `arv = 0`. Change the logic: if `p.project_type === 'contractor'`, route them through a **separate contractor calculation path** regardless of ARV.
- For contractor projects:
  - `contractValue = p.purchase_price ?? 0`
  - `totalSpent = sum of all category actual spend`
  - `totalBudget = plannedBudget`
  - `costBasis = totalBudget > 0 ? Math.max(totalBudget, totalSpent) : totalSpent`
  - `grossProfit = contractValue - costBasis`
  - Push to `configuredList` with `isContractor: true`, and `arv = contractValue` (for display purposes), setting `transactionCosts`, `holdingCosts` all to `0`.
- Non-contractor projects with `arv <= 0` still go to `unconfiguredList` as before.

**Table Rendering**
- Contractor rows render differently in the table:
  - **ARV** column → show "—" (or "Contract Value" label in small text + the dollar amount)
  - **Purchase Price** column → show "—" (not applicable for contractors)
  - **Construction Costs** column → relabel dynamically: show "Job Cost" badge for contractor rows
  - **Transaction / Holding** columns → show "—" for contractors
  - **Profit** column → show Gross Profit (color-coded)
- Add a small `HardHat` icon badge next to contractor project names in the table for visual differentiation.

**Totals Footer**
- The `totalProfit` already sums `p.profit` — contractor gross profits will be included automatically once added to `configuredList`.
- `totalARV`, `totalPurchase`, etc. will be slightly misleading for contractors, but since they'll show "—" per-row, the footer can keep summing only non-contractor values to stay accurate. Add a `totalContractorProfit` separate sum, or simply mark contractor profit as included in the grand `totalProfit`.

#### 2. `src/components/settings/DashboardPreferencesCard.tsx`

- Add `{ value: 'contractor', label: 'Contractor' }` to the `PROJECT_TYPES` array.
- Add `'contractor'` to `DEFAULT_FILTERS.types` so it's on by default.

#### 3. `src/pages/ProfitBreakdown.tsx` — `ALL_TYPES` & defaults

- `ALL_TYPES` becomes `['fix_flip', 'rental', 'new_construction', 'wholesaling', 'contractor']`
- `deriveSelectedTypes` will now include contractor in the full set.

---

### Contractor Row Display Logic (Table)

```text
| Project Name 🪖  | Contract Value | — (Purchase) | Job Cost (budget/actual) | — | — | Gross Profit |
```

The column headers stay the same for simplicity. Contractor-specific rows show "—" in ARV, Purchase Price, Transaction, and Holding columns, and show Contract Value in the ARV column with a small label.

---

### Files to Modify
- `src/pages/ProfitBreakdown.tsx` — main data + rendering logic
- `src/components/settings/DashboardPreferencesCard.tsx` — add Contractor checkbox to preferences
