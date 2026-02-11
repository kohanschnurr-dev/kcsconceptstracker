
## Add Category Change to Expense Details Modal

### What Changes
In the Expense Details modal, the category badge (currently read-only) becomes a dropdown selector so you can reassign the expense to a different category (e.g., change from "Misc." to "Foundation"). Clicking "Save" persists the new category along with notes and receipt changes.

### Technical Details

**1. Update `ExpenseDetailModal` props and state**

**File: `src/components/ExpenseDetailModal.tsx`**
- Add `categories: { id: string; category: string }[]` prop to receive available project categories
- Add `categoryId` state variable initialized from `expense.category_id`
- Import `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from the UI library
- Import `BUDGET_CATEGORIES` (or `getBudgetCategories`) for label lookups

**2. Replace the static category Badge with a Select dropdown**

**File: `src/components/ExpenseDetailModal.tsx`**
- In the badges row, replace the static `<Badge>{categoryLabel}</Badge>` with a `<Select>` dropdown populated from the `categories` prop
- Style it compact so it fits naturally among the other badges

**3. Include `category_id` in the save handler**

**File: `src/components/ExpenseDetailModal.tsx`**
- In `handleSave`, add `category_id: categoryId` to the `updateData` object so the new category is persisted to the database

**4. Pass categories from the parent pages**

**File: `src/pages/ProjectBudget.tsx`**
- Pass the existing `categories` array to `<ExpenseDetailModal categories={categories} />`

**File: `src/pages/Expenses.tsx`**
- Check how categories are available and pass them similarly (may already have them from project data)

**File: `src/pages/BusinessExpenses.tsx`** (if applicable)
- Same treatment for the `BusinessExpenseDetailModal` if needed
