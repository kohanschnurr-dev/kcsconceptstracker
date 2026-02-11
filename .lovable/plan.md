

## Fix: Procurement Item Save Failure

### Root Cause
The database has check constraints on the `procurement_items` table that don't match the values the code sends:

**Phase constraint** allows: `demo`, `rough_in`, `drywall`, `trim_out`, `final`
**Code sends**: `rough_in`, `trim_out`, `finish`, `punch`

Mismatch: `finish` (code) vs `final` (DB), and `punch` doesn't exist in the constraint at all.

**Status constraint** allows: `researching`, `in_cart`, `ordered`, `shipped`, `on_site`, `installed`
**Code sends**: `researching`, `in_cart`, `ordered`, `delivered`, `installed`

Mismatch: `delivered` (code) vs `shipped`/`on_site` (DB).

Your item failed because the "Finish" stage sends `phase: 'finish'` but the database only accepts `'final'`.

### Fix
Update the database check constraints to accept the values the application actually uses. This is the safest approach since the UI labels are already user-friendly.

**Database migration:**
1. Drop the old `procurement_items_phase_check` constraint
2. Add new constraint allowing: `demo`, `rough_in`, `drywall`, `trim_out`, `finish`, `punch`, `final`
3. Drop the old `procurement_items_status_check` constraint
4. Add new constraint allowing: `researching`, `in_cart`, `ordered`, `delivered`, `shipped`, `on_site`, `installed`

This adds the missing values while keeping the old ones valid (so existing data isn't broken).

No code changes needed -- the modal is working correctly; the database constraint was just too restrictive.
