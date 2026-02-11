

## Sort Manage Sources Accordion Items Alphabetically (A-Z)

### What Changes

**File: `src/components/settings/ManageSourcesCard.tsx`**

Reorder the `AccordionItem` elements in the JSX so they appear alphabetically by their trigger label:

1. Budget Calculator Categories
2. Business Expense Categories
3. Calendar Categories
4. Expense Categories
5. Monthly Expense Types
6. Procurement Stores
7. Property Info Fields

Currently the order is: Budget Calculator Categories, Calendar Categories, Expense Categories, Monthly Expense Types, Business Expense Categories, Procurement Stores, Property Info Fields. The only items out of order are "Business Expense Categories" (needs to move up to position 2) and "Calendar Categories" (moves to position 3).

This is a simple reorder of the existing JSX blocks -- no logic changes.

