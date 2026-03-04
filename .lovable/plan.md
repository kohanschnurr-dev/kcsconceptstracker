

## Add Temporary "Demo Mode" Button to Dashboard

A simple client-side toggle that replaces real project data with randomized fake data in memory (no database changes). When activated, it swaps names, addresses, cover photos, and financial figures so the dashboard is safe for screen recording.

### Changes

**File: `src/pages/Index.tsx`**

1. Add a `demoMode` boolean state and a `demoProjects` derived list
2. Add a small button in the header row (next to "Dashboard" title) labeled "Demo Mode" with an eye-slash icon
3. When toggled ON:
   - Map over `projects` and replace each project's `name` with a random property name from a pool (e.g., "Maple Street Flip", "Riverside Bungalow", "Cedar Park Ranch")
   - Replace `address` with a randomized fake address (e.g., "1234 Elm St, Austin, TX 78701")
   - Randomize `arv`, `purchasePrice`, `totalBudget` within realistic ranges
   - Null out `coverPhotoPath` so real photos don't show
   - Randomize category `actualSpent` values proportionally
4. Use `demoProjects` instead of `projects` for all rendering when demo mode is on
5. The button toggles — click again to restore real data
6. Style the button as a small ghost button with a `Monitor` or `Eye` icon so it's obvious but unobtrusive

This is entirely in-memory — no database writes, no edge functions. The real data stays untouched. The button can be removed later by deleting the state + button + mapping logic.

### Files Modified
- `src/pages/Index.tsx` only

