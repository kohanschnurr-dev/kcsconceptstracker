

## Add Loan Costs and Monthly Costs Columns to Profit Breakdown Table

### What Changes
1. Add two new columns to the table: **Loan Costs** and **Monthly Costs** after Rehab Costs
2. Center-align all column headers and values except the Project column (stays left-aligned)
3. Shift the table content leftward for better spacing

### Data Sources
- **Loan Costs**: Summed from the `loan_payments` table per project
- **Monthly Costs**: Summed from the `expenses` table where `expense_type = 'monthly'` per project

### Technical Steps

**`src/pages/ProfitBreakdown.tsx`**

1. **Fetch additional data**
   - Add `loan_payments` query to the existing `Promise.all` fetch
   - Query: `supabase.from('loan_payments').select('project_id, amount')`
   - For monthly costs, filter existing expenses data by `expense_type === 'monthly'`

2. **Extend the `ProjectProfit` interface**
   - Add `loanCosts: number` and `monthlyCosts: number` fields
   - Compute totals per project during the data processing loop

3. **Update the table layout**
   - Column order: Project | ARV | Purchase Price | Rehab Costs | Loan Costs | Monthly Costs | Profit
   - All headers and cell values use `text-center` alignment except:
     - "Project" column header and its cells stay `text-left`
   - Add corresponding footer totals for the new columns

4. **Profit calculation stays unchanged**
   - The new columns are informational/display-only
   - Profit formula remains: `ARV - Purchase Price - MAX(actual, budget)`
