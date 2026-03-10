

## Fix Build Error & Investigate Calendar Blank Screen

### 1. Build Error Fix (quickbooks-sync)
**File:** `supabase/functions/quickbooks-sync/index.ts`

The variable `serviceSupabase` is declared twice with `const` at lines 110 and 240. Fix: rename the second one or move the first declaration to a broader scope, or simply reuse the existing one by removing the second `const`.

- **Line 240**: Change `const serviceSupabase = createClient(...)` to just reuse the one from line 110 (remove the redeclaration).

### 2. Calendar Blank Screen
The screenshot shows the published site at `groundworksapp.com/calendar` rendering a completely blank page. This is likely caused by an unhandled error in the Calendar page crashing the React tree. Possible causes:
- A runtime error in data fetching or rendering that isn't caught
- The `CalendarTask` state or project state causing a crash on certain data

Since there are no console logs captured, I'll add an error boundary or try-catch around the fetch in `Calendar.tsx` to prevent blank screens, and review the calendar components for potential crash points.

**Files to edit:**
- `supabase/functions/quickbooks-sync/index.ts` — remove duplicate `const serviceSupabase` declaration on line 240
- `src/pages/Calendar.tsx` — add error handling around `fetchData` to prevent blank screen crashes

