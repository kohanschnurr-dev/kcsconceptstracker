

## Add Date Picker to "To Date" for Custom End Date

### Overview
Replace the simple tooltip on the "To Date" button with a popover that contains a date picker. The date picker defaults to today's date but allows the user to select a future (or past) date -- e.g., an expected sale date 3 weeks out. The "To Date" calculation will use the selected date instead of `new Date()`.

### Changes in `src/components/project/HardMoneyLoanCalculator.tsx`

1. **Add state for the "To Date" target date**
   - `const [toDateEndDate, setToDateEndDate] = useState<Date>(new Date());`
   - This defaults to today and drives both `toDateMonths` and `toDateDays`.

2. **Update `toDateMonths` and `toDateDays` to use `toDateEndDate` instead of `new Date()`**
   - `toDateMonths`: compute months between `projectStartDate` and `toDateEndDate`.
   - `toDateDays`: compute days between `projectStartDate` and `toDateEndDate`.
   - Both recalculate whenever `toDateEndDate` changes.

3. **Update `calculateToDateMonths`** (or inline its logic) to accept an end date parameter instead of always using `now`.

4. **Replace the Tooltip wrapper with a Popover containing a calendar**
   - Clicking the "To Date" button still sets the loan term as before.
   - A small calendar icon or dropdown arrow opens a popover with a `Calendar` date picker.
   - Selecting a date updates `toDateEndDate`, which recalculates months/days and auto-applies the new term.
   - The tooltip showing days will move into the popover header or remain as a small label.

5. **UI layout for the "To Date" area**
   - The button text stays "To Date".
   - Next to it (or as a split button), a small calendar trigger opens the date picker popover.
   - Inside the popover: a small header showing "X days from start", the `Calendar` component, and a "Reset to Today" link.

### Technical Detail

```
State: toDateEndDate (Date, defaults to new Date())

toDateMonths = diff(projectStartDate, toDateEndDate) in months
toDateDays = diff(projectStartDate, toDateEndDate) in days

UI:
[To Date] [calendar icon trigger]
            |-- Popover -----------|
            | "X days from start"  |
            | [  Calendar picker ] |
            | Reset to Today       |
            |----------------------|
```

When the user picks a date, `toDateEndDate` updates, `toDateMonths` recalculates, and `setLoanTermMonths(toDateMonths)` is called automatically. The preset-loading effect will also use `toDateEndDate` for its initial calculation.

