

## Make Save/Cancel Buttons Sticky in Group Settings Dialog

The "Save" and "Cancel" buttons in the per-group settings dialog (e.g. "Other Settings") scroll off-screen when the category list is long. Users toggling visibility items at the top won't see the save button without scrolling all the way down.

**File:** `src/components/budget/BudgetCanvas.tsx`

**Changes (lines ~479-611):**

1. Remove `overflow-y-auto` from the `DialogContent` — move scrolling to the inner content area only
2. Wrap the content between `DialogHeader` and `DialogFooter` in a `ScrollArea` (or a `div` with `overflow-y-auto flex-1`) so only the middle scrolls
3. Make `DialogContent` use `flex flex-col` layout so header and footer stay fixed at top/bottom
4. Add a top border and background to `DialogFooter` so it visually separates from scrollable content (e.g. `border-t bg-background pt-4 sticky bottom-0`)

This ensures Save/Cancel are always visible regardless of how many categories are in the group.

