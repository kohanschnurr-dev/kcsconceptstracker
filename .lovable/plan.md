

## Keep All Category Lists Sorted A-Z

### Problem
When new categories are added, they append to the end of their group. The user wants all lists to always display in alphabetical order by label.

### Solution
Sort items alphabetically at the display level in `ManageSourcesCard.tsx` and in the `useCustomCategories` hook so every consumer gets sorted data.

### Technical Details

**File: `src/hooks/useCustomCategories.ts`**
- In the `addItem` callback, after adding the new item, sort the resulting array by `label` (case-insensitive) using `localeCompare`
- Update the initial state loader to also sort items when loading from localStorage
- This ensures all consumers of the hook (not just the settings UI) always receive A-Z sorted items

**File: `src/components/settings/ManageSourcesCard.tsx`**
- In `renderItems()`, sort `groupItems` alphabetically by label before mapping to badges (for the grouped calendar view)
- In the ungrouped branch, sort `items` alphabetically by label before mapping

This two-layer approach ensures:
1. Data is stored sorted (via the hook)
2. Display is always sorted even if older unsorted data exists in localStorage
