
## Fix Export Reports - Complete Data & CSV Formatting

### Problems Identified

| Issue | Description |
|-------|-------------|
| **Split columns in Excel** | Currency values like `$60,575.00` contain commas, breaking CSV into separate columns (shows "$60" then "575") |
| **Missing expense details** | Only manual expenses are passed to report; QuickBooks expenses are excluded even though they exist |
| **Actual spent shows $0** | The categories have `actualSpent` correctly calculated, but the exported CSV shows all zeros (likely old cache OR formatting issue) |

---

### Root Cause Analysis

**1. CSV Comma Issue**
```tsx
// Current (BROKEN):
`Total Budget,${formatCurrency(project.total_budget)}`
// Output: Total Budget,$60,575.00  <-- comma in $60,575.00 breaks CSV
```

**2. Missing QuickBooks Expenses**
In `ProjectDetail.tsx`, only manual expenses are passed:
```tsx
const expensesData = expensesRes.data || [];  // Manual only
<ExportReports expenses={expenses} />  // Missing QB data
```

QuickBooks expenses are fetched separately (`qbExpensesData`) but not included.

---

### Technical Changes

**File: `src/components/project/ExportReports.tsx`**

| Change | Location | Description |
|--------|----------|-------------|
| Fix CSV formatting | Throughout | Replace `formatCurrency()` in CSV cells with raw numbers (no commas) |
| Quote all values | All CSV rows | Ensure every cell is properly quoted to handle edge cases |

**File: `src/pages/ProjectDetail.tsx`**

| Change | Location | Description |
|--------|----------|-------------|
| Combine expenses | Lines 161-163 | Pass both manual + QB expenses to ExportReports |
| Add QB expense state | Line 102-103 | Store QB expenses in state |

---

### Specific Code Changes

**1. ExportReports.tsx - Fix CSV Currency Formatting**

Create a new helper for CSV-safe currency (no dollar sign, no commas):
```tsx
const formatCurrencyForCSV = (amount: number) => {
  return amount.toFixed(2);
};
```

Update all CSV lines to use proper formatting:
```tsx
// Before (breaks CSV):
`Total Budget,${formatCurrency(project.total_budget)}`

// After (works correctly):
`"Total Budget","${formatCurrency(project.total_budget)}"`
// OR for data cells:
`"Total Budget","$${amount.toFixed(2)}"`
```

**2. ProjectDetail.tsx - Include QuickBooks Expenses**

```tsx
// Add state for QB expenses
const [qbExpenses, setQbExpenses] = useState<DBQBExpense[]>([]);

// In fetchProjectData, store QB expenses
setQbExpenses(qbExpensesData);

// Pass combined expenses to ExportReports
<ExportReports 
  expenses={[...expenses, ...qbExpenses.map(qb => ({
    id: qb.id,
    amount: qb.amount,
    date: qb.date,
    vendor_name: qb.vendor_name,
    description: qb.memo,
    payment_method: qb.payment_type,
    category_id: qb.category_id,
    includes_tax: false,
    tax_amount: null,
    status: 'completed'
  }))]}
/>
```

---

### Before vs After

**CSV Output Example:**

| Before | After |
|--------|-------|
| `Total Budget,$60,575.00` (splits) | `"Total Budget","$60575.00"` (correct) |
| `Roofing,6000.00,0,6000.00,100.0%` | `"Roofing","6000.00","5500.00","500.00","8.3%"` |
| Expense details: empty | Expense details: all QB + manual |

---

### Summary

1. **Fix CSV commas** - Remove commas from currency OR properly quote all cells
2. **Include QuickBooks expenses** - Combine manual + QB expenses for complete export
3. **Verify actualSpent flows correctly** - Already fixed, just needs the combined data
