

## Move Payment Frequency to Left Column

Move the "Payment Freq." row from the right-side column to the left-side column, placing it directly under "Maturity Date" so both columns have an even number of rows.

### Change

**`src/components/project/ProjectLoanTab.tsx`**
- Remove `<InfoRow label="Payment Freq." ...>` from the right column (line 149)
- Add it to the left column after "Maturity Date" (after line 143)

Result: Left column gets 5 rows (Lender, Type, Start Date, Maturity Date, Payment Freq.) and right column gets 5 rows (Original Amount, Interest Rate, Term, Origination Fee, Other Closing Costs) — balanced.

