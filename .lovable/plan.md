

## Remove "Budget Health" Display from Calendar Event Side Panel

The "Green Budget" indicator (lines 425-437 in `src/components/calendar/TaskDetailPanel.tsx`) will be removed from the event detail panel. This is the `$ Green Budget` text shown below the date range.

### Changes

**File: `src/components/calendar/TaskDetailPanel.tsx`**
- Remove the "Budget Health Display" block (the `div` containing the DollarSign icon and `{task.budgetHealth} Budget` label, approximately lines 425-437)
- Clean up the `DollarSign` import if no longer used elsewhere in the file

No other files are affected.

