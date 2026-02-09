

## Add "To Date" Button + Configurable Loan Term Slots

### Overview

Add a "To Date" button to the Loan Term selector that dynamically calculates months elapsed from the project's start date to today. Also add a small settings gear to let users customize which 4 term preset slots are shown, supporting months, years, and decimal values (e.g., 1.5 = 6 weeks).

### Changes

**1. `src/components/project/HardMoneyLoanCalculator.tsx`**

- Add a new prop: `projectStartDate?: string` to receive the project's start date
- Replace the hardcoded `termOptions = [6, 12, 18, 360]` with user-configurable term slots stored in `localStorage` (key: `loan-term-presets`)
- Default slots: `[6, 12, 18, 360]` (same as current)
- Support decimal/fraction values in the custom term input and settings (e.g., `1.5` months = ~6 weeks)
- Add a **"To Date"** button next to the term options that:
  - Calculates the difference in months (with decimals) between `projectStartDate` and `new Date()` (today)
  - Updates `loanTermMonths` to that value
  - Refreshes every time the component mounts / tab is viewed (uses current date)
  - Shows the calculated value on hover or as a label (e.g., "To Date (7.2)")
  - Disabled / hidden if no `projectStartDate` is available
- Add a small **Settings (gear) icon button** that opens a popover/dialog to configure the 4 term slots:
  - 4 input fields, each accepting a number (months) or a year value
  - A toggle or label to indicate months vs years (values over 24 stored as months internally)
  - Save to `localStorage` so it persists across sessions
  - Reset to defaults option

**2. `src/pages/ProjectDetail.tsx`**

- Pass `projectStartDate={project.start_date}` as a new prop to `HardMoneyLoanCalculator`

### UI Layout (Loan Term row)

```text
Loan Term (Months)
[ 6 ] [ 12 ] [ 18 ] [ 30yr ] [ Custom ] [ To Date (7.2) ] [gear icon]
```

- "To Date" button: highlighted style, shows calculated months from project start to today
- Gear icon: opens a small popover with 4 inputs to customize the preset slots
- All term values support decimals (e.g., 1.5 for 6 weeks)

### Settings Popover Layout

```text
Term Presets          [Reset]
Slot 1: [  6  ] months
Slot 2: [ 12  ] months  
Slot 3: [ 18  ] months
Slot 4: [ 360 ] months (= 30yr)
```

### Technical Details

- `loanTermMonths` state changes from `number` (integer) to `number` (float-capable) -- all calculations already use it as a number so no formula changes needed
- "To Date" calculation: `differenceInMonths` from `date-fns` won't give decimals, so we'll compute manually: `(today - startDate) / (1000 * 60 * 60 * 24 * 30.44)` rounded to 1 decimal
- localStorage key: `loan-term-presets`, storing `number[]` of length 4
- The Payoff Timeline comparison already filters by `<= loanTermMonths`, so decimal terms work naturally
- The Custom popover input will accept `step="0.5"` for fractional months
