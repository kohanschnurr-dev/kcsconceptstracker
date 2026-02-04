
## Plan: Auto-Save for Edit Item Modal

### Overview
Implement automatic saving for the "Edit Item" modal so changes are persisted immediately without requiring the user to click a Save button. This creates a more seamless editing experience.

---

### Current Behavior
- User opens Edit Item modal
- Makes changes to fields (name, price, category, notes, etc.)
- Must click "Update Item" button to save
- Clicking Cancel discards changes

---

### Proposed Behavior
- User opens Edit Item modal
- Changes auto-save after a brief debounce (500ms)
- Visual feedback shows save status (saving indicator)
- Cancel button closes modal (changes already saved)
- "Update Item" button removed for edit mode (only shown for new items)

---

### Technical Approach

**1. Add debounced auto-save effect**

Create a `useEffect` that watches `formData` changes when in edit mode (`item !== null`). Use a debounce timer to avoid saving on every keystroke.

```typescript
// Auto-save effect for edit mode
useEffect(() => {
  if (!item || step !== 'details') return;
  
  const timeoutId = setTimeout(() => {
    handleAutoSave();
  }, 500);
  
  return () => clearTimeout(timeoutId);
}, [formData, item, step]);
```

**2. Create handleAutoSave function**

Similar to `handleSubmit` but:
- Silent operation (no toast on every save)
- Sets a "saving" indicator state
- Shows brief "Saved" confirmation

```typescript
const [autoSaving, setAutoSaving] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);

const handleAutoSave = async () => {
  if (!item || !formData.name || !formData.unit_price) return;
  
  setAutoSaving(true);
  // ... same save logic as handleSubmit ...
  setAutoSaving(false);
  setLastSaved(new Date());
};
```

**3. Update modal footer for edit mode**

- Remove "Update Item" button when editing (auto-save handles it)
- Show save status indicator instead
- Keep Cancel button (renamed to "Close")

**4. Add save status indicator in header/footer**

Display subtle feedback:
- Spinner when saving
- "Saved" text with checkmark after successful save

---

### UI Changes

**Edit Mode Footer (after):**
```text
┌─────────────────────────────────────────────────────────────────┐
│                              [✓ Saved]  [Close]                 │
└─────────────────────────────────────────────────────────────────┘
```

**During save:**
```text
┌─────────────────────────────────────────────────────────────────┐
│                           [○ Saving...]  [Close]                │
└─────────────────────────────────────────────────────────────────┘
```

---

### Technical Details

**File: `src/components/procurement/ProcurementItemModal.tsx`**

1. Add new state variables:
   - `autoSaving: boolean` - tracks if currently auto-saving
   - `lastSaved: Date | null` - tracks last successful save time

2. Add `handleAutoSave` function:
   - Extracted save logic from `handleSubmit`
   - Silent operation (no toast notifications)
   - Updates `lastSaved` on success

3. Add debounced `useEffect`:
   - Triggers only when `item` exists (edit mode)
   - Triggers only when on 'details' step
   - 500ms debounce to avoid excessive API calls
   - Cleans up timeout on unmount

4. Modify `DialogFooter`:
   - When `item` exists (edit mode):
     - Show save status indicator
     - Show "Close" button instead of "Cancel"
     - Hide "Update Item" button
   - When adding new item:
     - Keep existing behavior with "Add Item" button

5. Extract shared save logic:
   - Create `saveItem` helper function used by both `handleSubmit` and `handleAutoSave`

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/procurement/ProcurementItemModal.tsx` | Add auto-save state, debounced effect, handleAutoSave function, update footer UI |

---

### Edge Cases Handled
- Empty required fields: Auto-save skips if name or price missing
- Rapid changes: Debounce prevents excessive saves
- Modal close during save: Save completes in background
- Network errors: Silent fail (no disruptive toasts during auto-save)
