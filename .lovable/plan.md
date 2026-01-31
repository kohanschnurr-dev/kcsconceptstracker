
## Fix QuickBooks Date Display Timezone Issue

### The Problem
The QuickBooks integration is showing **Dec 31, 2025** for transactions that are actually dated **Jan 1, 2026** in the database. This is a timezone display bug.

### Root Cause
In `QuickBooksIntegration.tsx`, the `formatDateDisplay` function uses `new Date(date)` which interprets date strings like `"2026-01-01"` as **midnight UTC**. When displayed in CST (UTC-6), this becomes Dec 31, 2025 at 6:00 PM.

**Current Code (Buggy):**
```javascript
const formatDateDisplay = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {...});
};
```

### The Fix
Replace the local `formatDateDisplay` function with the existing `formatDisplayDate` utility from `src/lib/dateUtils.ts`, which correctly parses date strings as local dates.

**Fixed Code:**
```javascript
import { formatDisplayDate } from '@/lib/dateUtils';

// Remove the local formatDateDisplay function
// Use formatDisplayDate(expense.date) instead
```

---

### Technical Changes

| File | Change |
|------|--------|
| `src/components/QuickBooksIntegration.tsx` | Import `formatDisplayDate` from dateUtils and use it instead of the local function |

---

### What Changes

1. **Import the utility**: Add `import { formatDisplayDate } from '@/lib/dateUtils'`
2. **Remove local function**: Delete the `formatDateDisplay` function (lines 291-297)
3. **Update usage**: Replace `formatDateDisplay(expense.date)` with `formatDisplayDate(expense.date)`

---

### Database vs Display Example

| Database Value | Current Display (Wrong) | After Fix (Correct) |
|----------------|------------------------|---------------------|
| `2026-01-01` | Dec 31, 2025 | Jan 1, 2026 |
| `2025-12-31` | Dec 30, 2025 | Dec 31, 2025 |

---

### Summary

This is a one-line import change plus removing the local function. The fix uses the existing centralized date utility that was specifically created to prevent this timezone issue across the app.
