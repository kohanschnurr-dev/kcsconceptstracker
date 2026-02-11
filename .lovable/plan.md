
## Add "Create New Category" Option to Reassignment Dialog

When deleting a category like "Foundation," you'll be able to type a brand-new category name (e.g., "Foundation Repair") directly in the reassignment dialog instead of only picking from existing ones.

### How It Will Work

1. The "Reassign expenses to" dropdown will have a **"+ Create new category"** option at the top
2. Selecting it reveals a text input where you type the new name (e.g., "Foundation Repair")
3. Clicking "Reassign & Remove" will:
   - Add "Foundation Repair" to your master category list (localStorage)
   - Create `project_categories` rows for it in each affected project
   - Move all expenses (regular + QuickBooks) from Foundation to Foundation Repair
   - Delete the old Foundation category

### Technical Details

**File: `src/components/settings/ReassignCategoryDialog.tsx`**

- Add a `createNew` boolean state and a `newCategoryLabel` string state
- Add a special `SelectItem` with value `__create_new__` labeled "+ Create new category"
- When selected, show an `Input` field below the dropdown for the new name
- On confirm, derive the value slug from the label (same logic as `useCustomCategories.addItem`), check for duplicates, then:
  - Call `onComplete` with both the old value to remove AND pass the new category info back
- Update the `onComplete` callback signature to optionally accept a new category `{ value, label }` to add to the master list

**File: `src/components/settings/ManageSourcesCard.tsx`**

- Update `handleReassignComplete` to also call `budget.addItem(label)` when a new category was created during reassignment
- Pass the `addItem` function (or a callback) to the dialog so it can register the new category in localStorage

This keeps the flow seamless -- delete Foundation, create Foundation Repair, and reassign all in one action.
