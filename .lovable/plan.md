

## Fix Site-Wide Date Timezone Offset Issue

When you select January 16th as a start date, it shows as January 15th. This is happening because JavaScript's `new Date()` and date-fns' `parseISO()` interpret `YYYY-MM-DD` strings as UTC midnight, which shifts to the previous day in US timezones.

---

## Root Cause

| What Happens | Why It's Wrong |
|--------------|----------------|
| `"2026-01-16"` stored in database | Correct value |
| `new Date("2026-01-16")` → UTC midnight | Interpreted as Jan 16 00:00:00 UTC |
| Display in CST (UTC-6) | Shows as Jan 15 18:00:00 CST = **wrong day** |

The same issue occurs with `parseISO("2026-01-16")` from date-fns.

---

## Solution

Create centralized date utility functions in `src/lib/dateUtils.ts` that parse date strings using local components instead of UTC, and update all components to use them.

### New File: `src/lib/dateUtils.ts`

```typescript
/**
 * Parse a YYYY-MM-DD date string as local date (not UTC)
 * Avoids the timezone offset issue where "2026-01-16" becomes Jan 15 in CST
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date to YYYY-MM-DD string using local components
 * Use this instead of toISOString().split('T')[0]
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string for display (e.g., "Jan 16, 2026")
 */
export function formatDisplayDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
```

---

## Files to Update

### High Priority (Displaying incorrectly)

| File | Issue | Fix |
|------|-------|-----|
| `src/pages/ProjectDetail.tsx` | `formatDate()` uses `new Date(date)` | Use `parseDateString()` |
| `src/pages/ProjectDetail.tsx` | Calendar `selected={new Date(project.start_date)}` | Use `parseDateString()` |
| `src/components/dashboard/ProjectCard.tsx` | `formatDate()` uses `new Date(date)` | Use `parseDateString()` |
| `src/pages/Calendar.tsx` | Uses `parseISO()` for dates | Use `parseDateString()` |
| `src/components/project/ProjectCalendar.tsx` | Uses `parseISO()` for dates | Use `parseDateString()` |
| `src/components/dashboard/CalendarGlanceWidget.tsx` | Uses `parseISO()` for dates | Use `parseDateString()` |
| `src/components/dashboard/TasksDueTodayBanner.tsx` | Uses `parseISO()` for dates | Use `parseDateString()` |

### Medium Priority (Other date displays)

| File | Issue |
|------|-------|
| `src/pages/Expenses.tsx` | `formatDate()` |
| `src/pages/BusinessExpenses.tsx` | `formatDate()` |
| `src/pages/ProjectBudget.tsx` | `formatDate()` |
| `src/pages/DailyLogs.tsx` | `formatDate()` |
| `src/components/ExpenseDetailModal.tsx` | `formatDate()` |
| `src/components/BusinessExpenseDetailModal.tsx` | `formatDate()` |
| `src/components/SmartSplitReceiptUpload.tsx` | `formatDate()` |
| `src/components/project/ProjectNotes.tsx` | `formatDate()` |
| `src/components/project/ProjectVendors.tsx` | `formatDate()` |
| `src/components/project/MilestonesTimeline.tsx` | `formatDate()` |
| `src/components/project/StatDrilldownModal.tsx` | `formatDate()` |
| `src/components/project/ExportReports.tsx` | `formatDate()` |
| `src/components/dashboard/RecentExpenses.tsx` | `formatDate()` |

### Also Fix: New date initialization

| File | Issue | Fix |
|------|-------|-----|
| `src/components/NewProjectModal.tsx` | Uses `new Date().toISOString().split('T')[0]` | Use `formatDateString(new Date())` |

---

## Implementation Steps

1. Create `src/lib/dateUtils.ts` with the helper functions

2. Update `src/pages/ProjectDetail.tsx`:
   - Import `parseDateString` and `formatDisplayDate`
   - Replace `formatDate()` function body
   - Change `selected={new Date(project.start_date)}` to `selected={parseDateString(project.start_date)}`

3. Update `src/components/dashboard/ProjectCard.tsx`:
   - Import and use `formatDisplayDate()`

4. Update `src/pages/Calendar.tsx`:
   - Replace `parseISO(event.start_date)` with `parseDateString(event.start_date)`
   - Same for `end_date` and `expected_date`

5. Update `src/components/project/ProjectCalendar.tsx`:
   - Same parseISO replacements

6. Update `src/components/dashboard/CalendarGlanceWidget.tsx`:
   - Replace parseISO with parseDateString

7. Update `src/components/dashboard/TasksDueTodayBanner.tsx`:
   - Replace parseISO with parseDateString

8. Update remaining 13 files with `formatDate()` functions to use centralized utilities

9. Update `src/components/NewProjectModal.tsx`:
   - Use `formatDateString(new Date())` for initialization

---

## Result

- All dates display correctly in the user's local timezone
- January 16th stays January 16th regardless of timezone
- Centralized utilities prevent future timezone bugs
- Consistent date handling across the entire application

