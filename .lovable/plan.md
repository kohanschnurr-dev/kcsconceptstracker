

## Theme the Native Date Picker to Match App Theme

### Problem
All `<input type="date">` fields across the app use the browser's native date picker, which renders with a white/light background that clashes with the dark theme (as shown in your screenshot).

### Solution
Add a CSS `color-scheme` rule targeting date inputs so the browser renders its native picker UI in dark mode, matching the app's theme. This is a **visual-only** change -- no behavior, interaction, or logic changes.

### Technical Detail

**File: `src/index.css`** -- Add CSS rules at the end of the file:

```css
/* Force native date picker to match dark theme */
input[type="date"],
input[type="datetime-local"],
input[type="time"] {
  color-scheme: dark;
}
```

This single CSS addition will fix every date input across all 13+ files that use `type="date"` (QuickExpenseModal, DailyLogs, ProjectVendors, LoanPayments, MilestonesTimeline, BusinessExpenses, DocumentUploadModal, etc.) without touching any component code.

### What to Test After
- Open the Quick Expense modal on the Project Budget page and click the date field -- picker should be dark themed
- Check Daily Logs date input
- Check Business Expenses date input
- Check any other date field across the app
- Verify the calendar still functions identically (selecting dates, navigation, etc.)

### Files
- **Edit**: `src/index.css` -- Add `color-scheme: dark` rule for date inputs
