
## Plan: Customizable Source Stores with Add/Remove/Save

### Overview
Allow users to customize the Source Store dropdown by:
1. Adding "Custom" as a built-in option alongside "Other"
2. Removing stores they don't use
3. Saving their preferences (persisted in localStorage)
4. Ability to reset to defaults

---

### Current State
The STORES constant is hardcoded:
```typescript
const STORES = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'home_depot', label: 'Home Depot' },
  { value: 'lowes', label: "Lowe's" },
  { value: 'floor_decor', label: 'Floor & Decor' },
  { value: 'build', label: 'Build.com' },
  { value: 'ferguson', label: 'Ferguson' },
  { value: 'other', label: 'Other' },
];
```

---

### Solution

**1. Add "Custom" to default stores list**

Update both `Procurement.tsx` and `ProcurementItemModal.tsx` to include "custom" in the SourceStore type and STORES array.

**2. Create customizable stores with localStorage persistence**

Add state management in `ProcurementItemModal.tsx`:
- Load saved stores from `localStorage.getItem('procurement-source-stores')`
- Allow users to remove stores via an "Edit Stores" dialog
- Allow users to add custom store names
- Provide "Reset to Defaults" option

**3. Edit Stores Dialog UI**

Add a settings gear icon next to the Source Store label that opens a dialog:
- List all available stores with X buttons to remove
- Input field to add custom stores
- Save and Reset buttons

---

### Technical Changes

**File: `src/pages/Procurement.tsx`**

1. Update `SourceStore` type to include `'custom'`
2. Add "Custom" to STORES array

**File: `src/components/procurement/ProcurementItemModal.tsx`**

1. Update `SourceStore` type to include `'custom'` and allow custom string values
2. Add "Custom" to default STORES array
3. Add state for customized stores list loaded from localStorage
4. Add "Edit Stores" dialog with:
   - List of current stores with remove (X) buttons
   - Input to add new custom store
   - Save to localStorage
   - Reset to defaults button
5. Add settings icon next to "Source Store" label to open the edit dialog

---

### Data Structure (localStorage)

```typescript
interface CustomStore {
  value: string;
  label: string;
  isCustom?: boolean; // true for user-added stores
}

// Key: 'procurement-source-stores'
// Value: JSON array of CustomStore objects
```

---

### UI Layout for Edit Dialog

```text
┌─────────────────────────────────────────┐
│           Edit Source Stores            │
├─────────────────────────────────────────┤
│ ○ Amazon                           [X]  │
│ ○ Home Depot                       [X]  │
│ ○ Lowe's                           [X]  │
│ ○ Floor & Decor                    [X]  │
│ ○ Build.com                        [X]  │
│ ○ Ferguson                         [X]  │
│ ○ Custom                           [X]  │
│ ○ Other                            [X]  │
│                                         │
│ [Add new store...        ] [+ Add]      │
│                                         │
├─────────────────────────────────────────┤
│         [Reset to Defaults]   [Save]    │
└─────────────────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Procurement.tsx` | Add `'custom'` to SourceStore type, add "Custom" to STORES array |
| `src/components/procurement/ProcurementItemModal.tsx` | Add customizable stores with localStorage, edit dialog, settings icon |

---

### Expected Behavior
- Users see all default stores plus "Custom" by default
- Clicking settings icon opens the Edit Stores dialog
- Removing a store removes it from the dropdown (localStorage persisted)
- Adding a new store adds it to the list
- Reset restores original defaults
- Changes persist across browser sessions
