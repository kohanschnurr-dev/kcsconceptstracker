

## Plan: Create Missing Database Tables for Loans

### Problem
The `loans` and `loan_draws` tables don't exist in the database. The code references them via `supabase.from('loans')` and `supabase.from('loan_draws')`, causing the error "Could not find the table 'public.loans' in the schema cache."

The existing `loan_payments` table has a different schema (project-based with `project_id` and `user_id`) than what the code expects (loan-based with `loan_id`).

### Changes

**Database Migration** -- Create two new tables:

1. **`loans`** table with all columns matching the `Loan` TypeScript interface:
   - Core: `id`, `user_id`, `project_id`, `nickname`, `lender_name`, `lender_contact`, `loan_type`, `loan_type_other`
   - Financial: `original_amount`, `outstanding_balance`, `interest_rate`, `rate_type`, variable rate fields
   - Terms: `loan_term_months`, `amortization_period_months`, `payment_frequency`, `payment_frequency_custom`, `interest_calc_method`
   - Dates: `start_date`, `maturity_date`, `first_payment_date`
   - Fees: `origination_fee_points`, `origination_fee_dollars`, `other_closing_costs`, prepayment/extension fields
   - Draws: `has_draws`, `total_draw_amount`, `draw_structure`, `custom_draw_terms`
   - Collateral: `collateral_type`, `collateral_description`, `ltv_at_origination`, `has_personal_guarantee`
   - Meta: `notes`, `status`, `monthly_payment`, `created_at`, `updated_at`
   - RLS: owner CRUD + team member SELECT

2. **`loan_draws`** table matching the `LoanDraw` interface:
   - `id`, `loan_id` (FK to loans), `draw_number`, `milestone_name`, `draw_percentage`, `draw_amount`, `expected_date`, `status`, `date_funded`, `notes`, `created_at`
   - RLS: via loan ownership

3. **Update `loan_payments`** -- Add a `loan_id` column (nullable, so existing data isn't broken) to link payments to specific loans, matching what the code expects when querying `.eq('loan_id', loanId)`.

### Files
- Database migration only (no code changes needed -- the code already references these tables correctly)

