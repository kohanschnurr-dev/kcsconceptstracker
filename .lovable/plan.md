

## Fix Checkbox Double-Toggle in Procurement Item Picker

### Problem
In the Item Picker modal (opened from the project Procurement tab via "Add from Library"), clicking a checkbox toggles it on and then immediately back off. This happens because both the parent `div` row and the `Checkbox` component call `toggleItem()` on click. The click event bubbles from the Checkbox up to the parent div, causing `toggleItem` to fire twice -- once to check, once to uncheck.

### Root Cause
In `src/components/project/ProcurementTab.tsx` (around line 887-896):

```text
<div onClick={() => toggleItem(item.id)}>     <-- fires toggleItem (1st call)
  <Checkbox onCheckedChange={() => toggleItem(item.id)} />   <-- fires toggleItem (2nd call)
</div>
```

Two calls to `toggleItem` in rapid succession: add to Set, then remove from Set. Net result: nothing changes.

### Fix

**File: `src/components/project/ProcurementTab.tsx`**

Add `e.stopPropagation()` to the Checkbox's click/pointer event so it doesn't bubble up to the parent div, OR remove the `onCheckedChange` handler from the Checkbox and let the parent div handle it alone (since the Checkbox's `checked` state is controlled). The cleanest approach:

- Keep the parent `div`'s `onClick` as the sole toggle trigger
- Change the `Checkbox` to use `checked` only (no `onCheckedChange`) and add `onClick={e => e.stopPropagation()}` so clicking directly on the checkbox doesn't double-fire
- Alternatively, remove the parent div's onClick and keep only the Checkbox's onCheckedChange, adding a click handler on the rest of the row separately

The simplest fix: add `onClick={(e) => e.stopPropagation()}` to the `Checkbox` and remove its `onCheckedChange`, letting the parent div handle all toggling.
