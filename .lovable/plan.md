

## Add Saved Budget Picker and Quick Budget Link to New Project Modal

### What Changes

**1. Saved Budget Dropdown in the Modal**
Replace the static info banner ("Budget will be automatically distributed across X categories...") with a saved budget selector. Users can pick from their saved budget templates to auto-fill the total budget and stage per-category allocations as a `pending_budget` on the newly created project.

**2. Quick Link to Budget Calculator**
Add a small "Open Budget Calculator" link/button below the budget field. Clicking it closes the modal and navigates the user to `/budget-calculator` so they can build a detailed budget from scratch, then apply it to the project afterward.

**3. Flow When a Saved Budget Is Selected**
- The Total Budget field auto-fills with the template's `total_budget` (still editable)
- On project creation, the template's `category_budgets` are written to the project's `pending_budget` column (same staging pattern used by the Budget Calculator and CreateBudgetModal)
- When the user opens the project, the existing `PendingBudgetDialog` auto-opens for approval -- no new approval UI needed

**4. Flow When No Budget Is Selected (default)**
- Same as today: user enters a manual total budget, categories initialize at $0
- The info banner updates to say "Categories start at $0. You can assign budgets later via the Budget Calculator."

---

### Technical Details

#### File: `src/components/NewProjectModal.tsx`

**New state:**
- `selectedTemplate` -- holds the picked `BudgetTemplate | null`

**New imports:**
- `useNavigate` from react-router-dom
- `Calculator` icon from lucide-react

**Fetch saved budgets:**
- On modal open, query `budget_templates` for the current user (same query pattern as `TemplatePicker` and `SavedBudgetsPanel`)
- Store in local state `savedBudgets`

**UI changes (bottom section, replacing the info banner):**
- A `Select` dropdown labeled "Apply Saved Budget (optional)" listing saved template names with their total amounts
- A "None" option to clear selection
- When a template is selected: auto-fill `totalBudget` with the template's `total_budget`
- Below the select: a subtle link "or build one in Budget Calculator" that navigates to `/budget-calculator`

**Submit logic update:**
- After creating the project and inserting `project_categories` (all at $0), if `selectedTemplate` is set:
  - Write `pending_budget` to the project with the template's `category_budgets` and `total_budget`
  - This triggers the existing approval flow when the user views the project

#### No other files need changes
- The `PendingBudgetDialog` and `PendingBudgetBanner` already handle the `pending_budget` column
- The budget approval merge logic already handles new vs existing categories

