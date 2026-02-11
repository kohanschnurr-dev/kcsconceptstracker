
## Fix "Uncategorized" Labels in Project Procurement Tab

### Problem
The project Procurement tab shows "Uncategorized" for all items because the `getCategoryName` function only checks `category_id` (which references the project's budget categories table). However, items edited in the main Procurement page store their category in the `category` string field (e.g., "bathroom", "hardware"). Since `category_id` is usually null, everything shows as "Uncategorized."

### Fix

**File: `src/components/project/ProcurementTab.tsx`**

1. **Add `category` field to the `ProcurementItem` interface** (around line 49) so the string category is available alongside `category_id`.

2. **Update `getCategoryName` function** (around line 192) to fall back to the `category` string field when `category_id` is null. It will reuse the same category-to-label mapping used on the main Procurement page (e.g., "bathroom" becomes "Bathroom", "hardware" becomes "Hardware").

Updated logic:
```text
getCategoryName(item):
  1. If category_id exists, look it up in project budget categories (existing logic)
  2. Else if category string exists, map it to a human-readable label
  3. Otherwise show "Uncategorized"
```

No database changes needed -- the `category` field already exists on `procurement_items` and is already being fetched by the query.
