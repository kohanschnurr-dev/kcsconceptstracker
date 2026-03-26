

## Plan: Add Star-to-Favorite Default View Mode

### What
Add a small star icon next to the active view mode toggle (Category | Timeline) that lets users "favorite" their preferred default view. When the calculator opens, it loads whichever view has the star.

### How

**File: `src/components/budget/BudgetCanvas.tsx`**

1. **New localStorage key**: `budget-view-mode-favorite` — stores `'category'` or `'timeline'`

2. **State**: Add `favoriteMode` state initialized from localStorage (default: `'category'`)

3. **Startup logic**: Change the `viewMode` initializer to read from `budget-view-mode-favorite` instead of `budget-view-mode`. The favorite IS the startup default.

4. **Star icon**: Add a `Star` icon (from Lucide, already imported in the project) to the right of the toggle pill. Clicking it sets the current `viewMode` as the favorite:
   - If current view is already the favorite → star is filled gold (`fill-amber-400 text-amber-400`)
   - If not → star is outline only; clicking it saves current view as favorite
   - Tooltip: "Set as default view"

5. **UI placement** (after line ~571, inside the toggle `div`):
```
[Category] [Timeline] [★]
```
The star sits inside the same border container, separated by a thin divider.

### Single file change
- `src/components/budget/BudgetCanvas.tsx` — add ~15 lines for state, star button, and persistence logic

