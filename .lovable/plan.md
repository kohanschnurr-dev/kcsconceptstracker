
## Fix SmartSplit to Complete Full Import in One Step

The current SmartSplit flow leaves matched expenses in the QuickBooks pending list because it only attaches receipt data but does not assign a project/category. The user wants SmartSplit to handle the complete import in one action.

### Current Flow (Problem)
1. Upload receipt in SmartSplit
2. AI parses receipt and suggests categories  
3. User clicks "Match & Continue" 
4. Receipt notes and image attach to QB expense (but it stays pending)
5. User must STILL go to QB section, select project/category, click checkmark

### New Flow (Solution)
1. Upload receipt in SmartSplit
2. AI parses receipt and suggests categories
3. User clicks "Match & Continue" → modal opens showing:
   - Line items with editable categories (already implemented)
   - **Project selector dropdown** (new)
   - **Product/Labor toggle** (new)
4. User selects project and confirms
5. Full import happens: expense moves to expenses table, disappears from both SmartSplit and QB pending lists

---

## Technical Implementation

### 1. Update SmartSplit Match Modal
**File: `src/components/SmartSplitReceiptUpload.tsx`**

Add to the match confirmation modal:
- Project selector dropdown (using the projects passed to QuickBooksIntegration)
- Product/Labor toggle group
- Make "Match & Import" button disabled until project is selected

The modal will need access to the projects list. This requires:
- Adding `projects` prop to `SmartSplitReceiptUpload`
- Adding state for `selectedProject` and `expenseType`

### 2. Update finalizeImport Function
**File: `src/components/SmartSplitReceiptUpload.tsx`**

Change from:
- Mark receipt as imported
- Attach notes/receipt URL to QB expense (keep is_imported = false)

To:
- Mark receipt as imported
- Find/create the project_category for the selected category
- Insert into `expenses` table with:
  - `project_id`: from dropdown
  - `category_id`: from created/found project_category
  - `amount`, `date`, `vendor_name`: from QB expense
  - `notes`: from line items
  - `receipt_url`: from pending receipt
  - `expense_type`: from Product/Labor toggle
- Mark QB expense as `is_imported = true`

### 3. Update QuickBooksIntegration
**File: `src/components/QuickBooksIntegration.tsx`**

Pass the `projects` prop to SmartSplitReceiptUpload:
```tsx
<SmartSplitReceiptUpload 
  projects={projects}
  onReceiptProcessed={onExpenseImported} 
  onRefreshQBExpenses={fetchPendingExpenses}
/>
```

### 4. Add Project Category Creation Logic
The `finalizeImport` function needs the same category lookup/creation logic that exists in `useQuickBooks.categorizeExpense`:
- Check if `project_categories` row exists for project + category
- If not, create it with `estimated_budget: 0`
- Use the resulting `category_id` for the expense insert

---

## UI Changes to Match Modal

The existing modal shows:
- Receipt image
- Line items with category dropdowns
- Tax line
- "Match & Continue" button

Add below the line items:
```
┌────────────────────────────────────────┐
│ Import to Project                       │
│ ┌──────────────────────────────────┐   │
│ │ Select Project            ▼      │   │
│ └──────────────────────────────────┘   │
│                                         │
│ Type: [Product] [Labor]                │
│                                         │
│ [Match & Import to Project]            │
└────────────────────────────────────────┘
```

The button text changes from "Match & Continue" to "Match & Import" and is disabled until a project is selected.

---

## Database Operations on Import

```sql
-- 1. Mark receipt as imported
UPDATE pending_receipts SET status = 'imported' WHERE id = :receipt_id;

-- 2. Find or create project_category
INSERT INTO project_categories (project_id, category, estimated_budget)
VALUES (:project_id, :category, 0)
ON CONFLICT (project_id, category) DO NOTHING
RETURNING id;

-- 3. Insert expense
INSERT INTO expenses (
  project_id, category_id, amount, date, vendor_name, 
  description, notes, receipt_url, expense_type, status
) VALUES (
  :project_id, :category_id, :amount, :date, :vendor_name,
  :description, :notes, :receipt_url, :expense_type, 'actual'
);

-- 4. Mark QB expense as imported (removes from pending list)
UPDATE quickbooks_expenses SET is_imported = true WHERE id = :qb_id;
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `SmartSplitReceiptUpload.tsx` | Add `projects` prop, project selector, Product/Labor toggle, update `finalizeImport` to create expense and mark QB as imported |
| `QuickBooksIntegration.tsx` | Pass `projects` to SmartSplitReceiptUpload |

This eliminates the two-step process - SmartSplit handles the complete import flow so matched receipts immediately appear in the expenses table.
