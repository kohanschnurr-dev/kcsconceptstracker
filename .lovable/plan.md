

## Update Rental Project Card Display

### What Changes
1. Replace the "Total Expenses / $582" box with **"Annual Cash Flow"** showing the cash flow figure instead
2. Remove the "Type: Rental Property" label from the bottom-left grid cell -- replace it with something more useful (e.g., show "Remaining" like other project types, or just show expenses)

### Technical Steps

**`src/components/dashboard/ProjectCard.tsx`**

1. **Rental summary box (lines ~107-111)**: Change label from "Total Expenses" to "Annual Cash Flow". For the value, compute annual cash flow if rental income data is available, otherwise show total expenses as a fallback for now.

2. **Bottom grid "Type" cell (lines ~119-123)**: The `isRental` branch currently renders "Type: Rental Property". Replace this with the same "Total Expenses" display so the spending info is not lost -- or simply show "Expenses" with the total spent amount, matching the pattern of the other project types' "Remaining" cell.

### Layout Result
- Top box: "Annual Cash Flow" with dollar amount
- Bottom-left: "Expenses" with total spent (instead of "Type: Rental Property")
- Bottom-right: Start Date (unchanged)
