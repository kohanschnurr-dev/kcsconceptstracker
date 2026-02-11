
## Add Confirmation Prompts for All Manage Sources Sections

Currently, only "Expense Categories" prompts before deletion. This will extend a similar confirmation dialog to all six sections, checking the database for usage before removing.

### How It Will Work

When you click X on any item in any section, a dialog will appear:

1. **Business Expense Categories** -- Checks `business_expenses` table for rows using that category value. Shows count and offers reassignment if any exist.
2. **Calendar Categories** -- Checks `calendar_events` table for rows where `event_category` matches. Shows count and offers reassignment.
3. **Expense Categories** -- Already implemented (keeps existing behavior).
4. **Monthly Expense Types** -- These are localStorage-only with no DB column storing this value, so a simple "Are you sure?" confirmation will be shown.
5. **Procurement Stores** -- Checks `procurement_items.source_store` for rows using that store value. Shows count and offers reassignment.
6. **Property Info Fields** -- Default fields map to dedicated DB columns and custom fields use a JSONB column. A simple confirmation will be shown since removing a field definition doesn't delete stored data.

### Technical Details

**New Component: `src/components/settings/GenericReassignDialog.tsx`**
- A reusable dialog that accepts:
  - `categoryLabel` / `categoryValue` -- the item being removed
  - `tableName` / `columnName` -- which DB table and column to check for usage
  - `remainingItems` -- the list of alternatives for reassignment
  - `onComplete` callback
- On open, queries the specified table/column for a count of matching rows
- If rows exist: shows count + reassignment dropdown, then updates the DB column from old value to new value on confirm
- If no rows: shows a simple "Are you sure you want to remove [item]?" confirmation
- Reuses the same visual pattern as the existing `ReassignCategoryDialog`

**Modified: `src/components/settings/ManageSourcesCard.tsx`**
- Add state to track which section is triggering the dialog (`pendingSection`) along with existing `pendingDelete`
- Wire each section's `onBeforeRemove` to open the `GenericReassignDialog` with the appropriate table/column config:
  - Business: `business_expenses` / `category`
  - Calendar: `calendar_events` / `event_category`
  - Monthly: no DB check, simple confirm
  - Stores: `procurement_items` / `source_store`
  - Property Info: no DB check, simple confirm
- Expense Categories keeps its existing specialized `ReassignCategoryDialog` (since it has the more complex project_categories logic)

**Existing `ReassignCategoryDialog` stays unchanged** -- it handles the unique expense category flow with `project_categories` and `expenses` table joins.

### Section-by-Section Config

| Section | DB Table | DB Column | Reassignment? |
|---|---|---|---|
| Business Expense Categories | `business_expenses` | `category` | Yes -- update matching rows |
| Calendar Categories | `calendar_events` | `event_category` | Yes -- update matching rows |
| Expense Categories | (existing dialog) | (existing logic) | Yes -- existing flow |
| Monthly Expense Types | none | none | Simple confirm only |
| Procurement Stores | `procurement_items` | `source_store` | Yes -- update matching rows |
| Property Info Fields | none | none | Simple confirm only |
