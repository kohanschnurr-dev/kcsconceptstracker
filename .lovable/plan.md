

## Fix: Unreadable Legend Text on Loan Charts

### Problem
The pie chart legend text color is hardcoded to `hsl(210, 20%, 95%)` (near-white), which is invisible against the light card background in light mode.

### Solution

**File: `src/components/loans/LoanCharts.tsx`**

Change the legend `formatter` span color from the hardcoded light color to `'hsl(210, 15%, 40%)'` — a neutral mid-gray that reads well on both light and dark backgrounds. Alternatively, use `'currentColor'` or a CSS variable approach, but since Recharts uses inline styles, a universally readable gray is simplest.

- Line 90: Change `color: 'hsl(210, 20%, 95%)'` → `color: 'hsl(210, 10%, 35%)'`
- Increase font size from `12` to `13` for better readability

Single-line change in one file.

