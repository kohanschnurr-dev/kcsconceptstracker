

## Loan Assignment for QuickBooks Expenses + Loan Payments Tracking

### Overview

Add the ability to mark a QuickBooks expense (like a wire transfer) as a "Loan" type, which then creates a loan payment record tied to the project. These payments appear in the project's Loan tab as a payment history section. Since loans are infrequent, the "Loan" option will be a subtle dropdown/select instead of a persistent toggle like Product/Labor.

### Database Changes

**1. New `loan_payments` table**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Default `gen_random_uuid()` |
| `project_id` | uuid (FK to projects) | Required |
| `user_id` | uuid | For RLS |
| `amount` | numeric | Payment amount |
| `date` | date | Payment date |
| `description` | text | e.g. "DOMESTIC WIRE TRANSFER" |
| `vendor_name` | text | Lender name |
| `payment_type` | text | "disbursement", "interest", "payoff", "other" |
| `source` | text | "manual" or "quickbooks" |
| `expense_id` | text | Link back to the expense/QB expense ID |
| `notes` | text | Optional notes |
| `created_at` / `updated_at` | timestamptz | Standard timestamps |

RLS: Users can only read/write their own rows.

### Frontend Changes

**1. Update `GroupedPendingExpenseCard.tsx` - Add "Loan" option**

- Replace the Product/Labor `ToggleGroup` with a slightly richer control:
  - Keep Product and Labor as the two main toggle buttons (unchanged look)
  - Add a small "Loan" text button or a third toggle option styled more subtly (muted/outline style, smaller) to the left of the Split button
  - When "Loan" is selected, the category dropdown becomes optional (auto-sets to a loan-related category or skips category requirement)
  - On import with "Loan" type: creates the expense as normal AND inserts a record into `loan_payments`

**2. Update `useQuickBooks.ts` - Handle loan type**

- Modify `categorizeExpense` to accept `expense_type` of `'product' | 'labor' | 'loan'`
- When type is "loan", also insert into `loan_payments` table after the normal expense import

**3. New component: `src/components/project/LoanPayments.tsx`**

- Displays a "Loan Payments" card within the Loan tab
- Shows a table of payments: Date, Description, Type, Amount
- Includes a manual "Add Payment" button with a simple modal
- Shows total paid to date

**4. Update `HardMoneyLoanCalculator.tsx` or Loan tab in `ProjectDetail.tsx`**

- Below the existing Loan Calculator card, render the new `LoanPayments` component
- This gives users a full picture: calculator above, actual payments below

### UI Behavior

The expense assignment row will look like:

```
[Select Project v] [Select Category v] [Note input]
                          [Loan] [Split] [Product] [Labor] [check]
```

- "Loan" is a subtle outline button (not orange/blue like Product/Labor)
- Clicking "Loan" deselects Product/Labor and vice versa
- When Loan is active, the category select is still available but not required (defaults to a general category)

### Technical Details

- `expense_type` field already exists in both `expenses` and `quickbooks_expenses` tables, so storing "loan" there requires no schema change on those tables
- The new `loan_payments` table is specifically for tracking payments in the Loan tab context
- The `LoanPayments` component fetches from `loan_payments` where `project_id` matches
- Manual payments can be added directly from the Loan tab without going through QuickBooks

