

## Update CSV Export Columns

### Changes
Remove the "Tax Amount" and "Amount" columns from the CSV exports, keeping only "Total" (the final amount including tax). Remove the "Status" column as well. Add a "Type" column showing "Product" or "Labor" based on the `expense_type` field.

### What Gets Updated

**File: `src/components/project/ExportReports.tsx`**

1. **Add `expense_type` to the Expense interface** (around line 20):
   - Add `expense_type?: string | null;`

2. **Expenses CSV (`exportExpensesCSV`, lines 89-109)**:
   - Headers change from: `Date, Vendor, Category, Description, Amount, Tax Amount, Total, Payment Method, Status`
   - To: `Date, Vendor, Category, Description, Type, Total, Payment Method`
   - Each row outputs `exp.expense_type` (capitalized, e.g., "Product" / "Labor") and the combined total
   - Totals row adjusted to match new column count

3. **Full Report CSV (`exportFullReportCSV`, lines 211-224)**:
   - Headers change from: `Date, Vendor, Category, Description, Amount, Tax, Total, Payment Method`
   - To: `Date, Vendor, Category, Description, Type, Total, Payment Method`
   - Same column adjustments as above

