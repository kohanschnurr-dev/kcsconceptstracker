

## CSV Import for Project Expenses

### Overview
Add an "Import CSV" button on the Project Budget page that lets you bulk-import historical expenses into the current project. The feature includes a downloadable sample CSV template showing the exact format required, a preview/review step before importing, and smart category matching that flags any rows whose category doesn't match an existing project category -- suggesting the closest match for you to reassign.

### How It Works

1. **Import button** appears next to the existing "Add Expense" button on the Project Budget page
2. Click it to open an import modal with two options:
   - **Download Sample CSV** -- a pre-filled template with example rows and all your category names as a reference sheet
   - **Upload CSV** -- select your file to begin
3. **Preview step** -- parses the CSV and shows a table of rows to be imported:
   - Rows with recognized categories get a green checkmark
   - Rows with unrecognized categories get a yellow warning with a dropdown to reassign them to an existing project category
   - Summary at top: "X rows ready, Y rows need category assignment"
4. **Confirm Import** -- inserts all resolved rows into the database as expenses on the current project

### Sample CSV Format

```text
Date,Vendor,Category,Description,Amount,Payment Method,Type,Tax Amount,Notes
2025-01-15,Home Depot,Flooring,LVP for living room,2450.00,card,actual,202.13,
2025-01-18,Mike's Plumbing,Plumbing,Rough-in for 2 bathrooms,3200.00,check,actual,0,Licensed & insured
2025-02-01,Lowe's,Electrical,Panels and wiring,1875.50,card,estimate,154.73,
```

**Column definitions:**
- **Date** -- MM/DD/YYYY or YYYY-MM-DD (both accepted)
- **Vendor** -- vendor/store name (optional)
- **Category** -- must match one of the app's category labels (e.g. "Flooring", "Plumbing", "HVAC"). The sample CSV will list all valid categories as a reference
- **Description** -- what was purchased (optional)
- **Amount** -- dollar amount (no $ sign needed)
- **Payment Method** -- cash, check, card, or transfer (optional, defaults to card)
- **Type** -- "estimate" or "actual" (optional, defaults to actual)
- **Tax Amount** -- tax portion if known (optional, defaults to 0)
- **Notes** -- any extra notes (optional)

### Category Matching Logic
- First tries exact match on category label (case-insensitive)
- Then tries fuzzy match (e.g., "Ext. Finish" would suggest "Exterior Finish")
- Unmatched rows are highlighted in the preview with a dropdown to pick the correct category
- You cannot import until all rows have a valid category assigned

### Technical Details

**New file: `src/components/project/ImportExpensesModal.tsx`**
- Modal with two-step flow: upload then preview/resolve
- Parses CSV client-side (no external library needed -- simple split-based parser handles quoted fields)
- Downloads sample CSV with all budget category labels from `getBudgetCategories()` listed in a reference section
- Category matching: normalize labels to lowercase, strip spaces/punctuation for comparison; use Levenshtein-like similarity for suggestions
- On confirm: batch-inserts into `expenses` table via Supabase, auto-creating `project_categories` rows (with $0 budget) for any categories the project doesn't have yet

**Modified file: `src/pages/ProjectBudget.tsx`**
- Add "Import CSV" button next to existing expense-add buttons
- Wire up the modal with current project ID and categories

### Files Modified
- `src/components/project/ImportExpensesModal.tsx` -- new component (CSV parser, preview table, category resolver, batch insert)
- `src/pages/ProjectBudget.tsx` -- add Import CSV button and modal state

