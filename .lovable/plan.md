

## Rename All "Vendor" Labels to "Contractor" App-Wide

### What Changes
Every user-facing instance of the word "Vendor" or "Vendors" will be renamed to "Contractor" or "Contractors" across the entire application -- expense forms, CSV exports, table headers, tooltips, toast messages, placeholders, and more.

Database column names (e.g. `vendor_name`, `vendor_id`) and internal variable names stay unchanged to avoid breaking backend logic.

### Files to Update

**Already done (no changes needed)**
- `src/components/layout/Sidebar.tsx` -- already "Contractors"
- `src/components/layout/MobileNav.tsx` -- already "Contractors"
- `src/components/layout/MobileBottomNav.tsx` -- already "Contractors"
- `src/pages/Vendors.tsx` -- already renamed
- `src/components/NewVendorModal.tsx` -- already renamed

**Contractor Management**

1. **`src/components/project/ProjectVendors.tsx`**
   - Card title: "Assigned Vendors" to "Assigned Contractors"
   - Button: "Assign Vendor" to "Assign Contractor"
   - Dialog title: "Assign Vendor to Project" to "Assign Contractor to Project"
   - Label: "Vendor *" to "Contractor *"
   - Placeholder: "Select a vendor" to "Select a contractor"
   - Button: "Assign Vendor" to "Assign Contractor"
   - Empty state: "No vendors assigned yet. Assign vendors to track..." to "No contractors assigned yet. Assign contractors to track..."
   - Notes placeholder: "...about this vendor on this project" to "...about this contractor on this project"
   - Toast: "Vendor assigned" / "Vendor removed" / "Failed to assign vendor" / "Failed to remove vendor" to use "Contractor"

2. **`src/components/dashboard/VendorComplianceTable.tsx`**
   - Title: "Vendor Compliance" to "Contractor Compliance"
   - Subtitle: "W9 status for vendors" to "W9 status for contractors"
   - Table header: "Vendor" to "Contractor"

3. **`src/hooks/useTeamRoles.ts`**
   - Permission label: "Manage Vendors" to "Manage Contractors"
   - Description: "Can add/edit vendors" to "Can add/edit contractors"

4. **`src/lib/ruleGroups.ts`**
   - Default group label: "Vendor Requirements" to "Contractor Requirements"

5. **`src/lib/pdfExport.ts`**
   - Remove leftover `'Vendor Directory'` from docType map (already has `'Contractor Directory'`)

**Expense Forms and Labels**

6. **`src/components/project/ExpenseActions.tsx`**
   - Label: "Vendor" to "Contractor"
   - Placeholder: "Vendor name" to "Contractor name"

7. **`src/pages/BusinessExpenses.tsx`**
   - Table header: "Vendor" to "Contractor"
   - Form label: "Vendor" to "Contractor"
   - Placeholder: "Vendor name" to "Contractor name"
   - CSV header: "Vendor" to "Contractor"

8. **`src/components/QuickExpenseModal.tsx`**
   - Form label: "Vendor" to "Contractor"
   - CSV column references: "Vendor" to "Contractor" in help text and table headers

9. **`src/pages/Expenses.tsx`**
   - CSV header: "Vendor" to "Contractor"

10. **`src/pages/ProjectBudget.tsx`**
    - CSV header: "Vendor" to "Contractor"
    - Search placeholder: "Search vendor or description..." to "Search contractor or description..."

**Tables and Drilldowns**

11. **`src/components/project/StatDrilldownModal.tsx`**
    - Section title: "Top Vendors" to "Top Contractors"
    - Empty state: "No vendors yet" to "No contractors yet"
    - Table header: "Vendor" to "Contractor"

12. **`src/components/project/ImportExpensesModal.tsx`**
    - Table header: "Vendor" to "Contractor"

13. **`src/components/project/ExportReports.tsx`**
    - CSV headers: "Vendor" to "Contractor" (both the plain CSV and the quoted PDF CSV)

**Detail Modals and Other UI**

14. **`src/components/project/GenerateReceiptSheet.tsx`**
    - Label: "Company / Vendor Name" to "Company / Contractor Name"
    - Placeholder: "Your company or vendor" to "Your company or contractor"

15. **`src/components/ExpenseDetailModal.tsx`**
    - Fallback text: "Unknown Vendor" to "Unknown Contractor"

16. **`src/components/BusinessExpenseDetailModal.tsx`**
    - Fallback text: "Unknown Vendor" to "Unknown Contractor"

17. **`src/components/SplitExpenseModal.tsx`**
    - Fallback text: "Unknown Vendor" to "Unknown Contractor"

18. **`src/components/GroupedExpenseDetailModal.tsx`**
    - Fallback text: "Unknown Vendor" to "Unknown Contractor"

19. **`src/components/quickbooks/GroupedPendingExpenseCard.tsx`**
    - Fallback text: "Unknown Vendor" (2 instances) to "Unknown Contractor"

20. **`src/components/BusinessQuickBooksIntegration.tsx`**
    - Fallback text: "Unknown Vendor" to "Unknown Contractor"

21. **`src/pages/ProjectBudget.tsx`**
    - Fallback text: "Unknown Vendor" to "Unknown Contractor"

22. **`src/components/SmartSplitReceiptUpload.tsx`**
    - Tooltip: "Vendor matched" / "Vendor did not match" to "Contractor matched" / "Contractor did not match"

23. **`src/components/project/LoanPayments.tsx`**
    - Label: "Lender / Vendor" to "Lender / Contractor"

### What Stays Unchanged
- All database column names (`vendor_name`, `vendor_id`, `project_vendors` table)
- Internal variable names and state names (e.g. `vendorName`, `setVendor`)
- URL routes (`/vendors`)
- File names (e.g. `ProjectVendors.tsx`, `VendorComplianceTable.tsx`)
- Edge function code (backend processing)

No database changes required.

