

## Enhance Item Picker with Bundle Filtering & Select All

### What This Does
Adds bundle-based filtering and bulk selection to the "Add Items from Library" modal, making it easy to import all items from a bundle (like "Rental Items") at once while still allowing individual item selection/deselection.

---

### Current Flow
1. Search items by name/model/finish
2. Individually select items one by one
3. Add selected items

### Enhanced Flow
1. **Filter by bundle** dropdown to show only items in a specific bundle
2. **"Select All in Bundle"** button to quickly select all visible items
3. **Deselect All** button to clear selections
4. Individual toggle still works to fine-tune selection before importing

---

### UI Changes

**New Filter Bar Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [🔍 Search by name, model number, or finish...]                     │
├────────────────────────────────┬────────────────────────────────────┤
│ [📁 Filter by Bundle ▼]        │ [✓ Select All]  [✗ Deselect All]  │
└────────────────────────────────┴────────────────────────────────────┘
```

**Bundle Filter Dropdown:**
- "All Items" (default - shows everything)
- "Rental Items" 
- "Oasis Bathroom"
- (any other bundles)

---

### Technical Changes

**File: `src/components/project/ProcurementTab.tsx`**

1. **Add new state in ItemPickerModal:**
   ```tsx
   const [bundles, setBundles] = useState<Bundle[]>([]);
   const [filterBundleId, setFilterBundleId] = useState<string>('all');
   const [itemBundleMap, setItemBundleMap] = useState<Map<string, string[]>>(new Map());
   ```

2. **Fetch bundles and item-bundle assignments:**
   ```tsx
   // In fetchAllItems or new function:
   const { data: bundlesData } = await supabase
     .from('procurement_bundles')
     .select('*')
     .order('name');
   
   const { data: bundleAssignments } = await supabase
     .from('procurement_item_bundles')
     .select('item_id, bundle_id');
   
   // Create map: item_id -> [bundle_ids]
   ```

3. **Update availableItems filter logic:**
   ```tsx
   const availableItems = useMemo(() => {
     return allItems.filter(item => {
       if (existingItemIds.includes(item.id)) return false;
       
       // Bundle filter
       if (filterBundleId !== 'all') {
         const itemBundles = itemBundleMap.get(item.id) || [];
         if (!itemBundles.includes(filterBundleId)) return false;
       }
       
       // Search filter
       if (searchQuery) { /* existing logic */ }
       return true;
     });
   }, [allItems, existingItemIds, searchQuery, filterBundleId, itemBundleMap]);
   ```

4. **Add Select All / Deselect All functions:**
   ```tsx
   const handleSelectAll = () => {
     const availableIds = availableItems.map(item => item.id);
     setSelectedIds(new Set(availableIds));
   };
   
   const handleDeselectAll = () => {
     setSelectedIds(new Set());
   };
   ```

5. **Update UI with bundle filter dropdown and bulk action buttons:**
   - Add Select dropdown for bundles after search input
   - Add "Select All" and "Deselect All" buttons
   - Update button states based on selection

---

### Data Flow

```text
User opens picker
       │
       ▼
Fetch: items + bundles + item_bundle_assignments
       │
       ▼
Build itemBundleMap (item_id → bundle_ids[])
       │
       ▼
User selects bundle filter → filters availableItems
       │
       ▼
User clicks "Select All" → selects all visible items
       │
       ▼
User can still toggle individual items
       │
       ▼
User clicks "Add X Items" → imports to project
```

---

### UI Mockup

```
┌───────────────────────────────────────────────────────────────────────┐
│ 📚 Add Items from Library                                        [X] │
├───────────────────────────────────────────────────────────────────────┤
│ 🔍 Search by name, model number, or finish...                         │
│                                                                       │
│ ┌──────────────────────────┐  [✓ Select All]  [✗ Clear Selection]    │
│ │ 📁 Filter by Bundle  ▼   │                                         │
│ │   All Items              │                                         │
│ │   ──────────────────     │                                         │
│ │   🏷️ Rental Items        │                                         │
│ │   🏷️ Oasis Bathroom      │                                         │
│ └──────────────────────────┘                                         │
│                                                                       │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ [✓] 📦 Front Door Handle Rental  | Grey | Amazon     | $79.99  │  │
│ │ [✓] 📦 Black Mailbox             | Black | Amazon    | $14.97  │  │
│ │ [ ] 📦 Cabinet Knobs Black       | Black | Amazon    | $23.99  │  │
│ │ ...                                                             │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│                        2 items selected      [Cancel] [Add 2 Items]  │
└───────────────────────────────────────────────────────────────────────┘
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/project/ProcurementTab.tsx` | Update `ItemPickerModal` with bundle filter, select all/deselect buttons |

---

### Summary

- Add bundle filter dropdown to show only items belonging to a specific bundle
- Add "Select All" button to select all currently visible/filtered items  
- Add "Deselect All" / "Clear Selection" button to clear selections
- User can still individually toggle items after bulk selection
- Useful for quickly adding all "Rental Items" to a project with one click

