

## Multi-Select Type Filter Pills

### Problem
The type filter pills (Fix & Flip, Rental, etc.) currently work as single-select -- you can only pick one type or "All Types". Users want to select multiple types at once (e.g., Fix & Flip + Rental).

### Fix

**`src/pages/ProfitBreakdown.tsx`**

Replace the single `typeFilter` state with a `Set`-based `selectedTypes` state that supports toggling multiple types on/off:

1. **Replace `typeFilter` with `selectedTypes: Set<string>`** -- initialized from dashboard preferences (e.g., 3 of 4 types checked = those 3 in the set; all or none = all 4 in the set). Remove the `preferredTypes` state since `selectedTypes` now handles multi-select natively.

2. **Update `handleTypeFilter`**:
   - Clicking "All Types" selects all 4 types
   - Clicking an individual type toggles it in/out of the set
   - If toggling would empty the set, re-select all instead (prevent zero selection)

3. **Update pill highlighting**:
   - "All Types" is highlighted when all 4 types are selected
   - Individual pills are highlighted when they're in the set

4. **Simplify `applyFilters`**: check if `item.projectType` is in `selectedTypes` (no more `preferredTypes` vs `typeFilter` branching)

5. **Update the settings-changed listener**: derive `selectedTypes` directly from preferences array instead of the old `typeFilter`/`preferredTypes` split

### Files to Change
- **`src/pages/ProfitBreakdown.tsx`** -- replace single-select type filter with multi-select toggle set
