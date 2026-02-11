

## Fix: Goals and Rules Keep Coming Back After Deletion

### Root Cause

The code in `BusinessExpenses.tsx` has a **seeding mechanism** that automatically re-creates default goals and rules whenever it finds zero records. So even after you delete them all, refreshing the page brings them right back.

### Solution

Remove the automatic seeding logic for both goals and rules. When you have 0 goals, it should show "0 goals" -- not silently re-create defaults.

### Technical Details

**File: `src/pages/BusinessExpenses.tsx`**

1. Remove the "Seed default goals if empty" block (lines ~187-195) that inserts 3 default goals when none exist
2. Remove the "Seed default rules if empty" block (lines ~199-onward) that inserts 6 default rules when none exist
3. Simply set the state directly from the query results:
   - `setGoals(goalsRes.data || []);`
   - `setRules(rulesRes.data || []);`

After this fix, you can open the Goals and Rules popouts, delete the unwanted entries using the trash buttons, and they will stay deleted.
