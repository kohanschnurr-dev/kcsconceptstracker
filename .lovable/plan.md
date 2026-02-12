

## Update Import CSV Template and Preview Table

### Problem
The import CSV template and preview table still show the old "Type" (estimate/actual) and "Tax Amount" columns. These should be removed, and a "Product/Labor" expense type column should replace the old "Type" column -- matching the export format.

### Changes

**File: `src/components/project/ImportExpensesModal.tsx`**

1. **Update the sample CSV template** (lines 155-166):
   - Header changes from: `Date,Vendor,Category,Description,Amount,Payment Method,Type,Tax Amount,Notes`
   - To: `Date,Vendor,Category,Description,Amount,Payment Method,Expense Type,Notes`
   - Update example rows to remove tax amounts and use "product"/"labor" instead of "actual"/"estimate"
   - Update instruction comments: remove "Type: estimate or actual" and "Tax Amount" lines, add "Expense Type: product or labor"

2. **Update CSV column parsing** (lines 209-219):
   - Remove `taxAmount` column mapping
   - Change `type` to map to "expense type" / "expensetype" / "expense_type" header
   - Parse values as "product" or "labor" instead of "estimate" or "actual"

3. **Update ParsedRow interface** (lines 23-37):
   - Remove `taxAmount: number`
   - Rename `type` semantically to `expenseType: string` (product/labor)

4. **Update row processing** (lines 227-262):
   - Remove tax amount parsing
   - Parse expense type as "product" or "labor" (default to "product")

5. **Update database insert** (lines 309-322):
   - Remove `includes_tax` and `tax_amount` fields (or default them)
   - Add `expense_type` field from parsed row
   - Default `status` to "actual" since we removed that column

6. **Update preview table** (lines 411-464):
   - Remove "Type" column (was showing estimate/actual)
   - Add "Expense Type" column showing Product/Labor badge
   - Keep Status column for error/success indicators

7. **Update help text** (lines 383-386):
   - Remove "Type (estimate/actual), Tax Amount" from optional columns description
   - Add "Expense Type (product/labor)" to optional columns

### Files Modified
- `src/components/project/ImportExpensesModal.tsx`
