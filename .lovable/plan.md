

## Add Loan Extensions Tracking

### Problem
The loan already stores `extension_fee` and `extension_terms` as simple fields, but there's no way to record actual extensions that have occurred — each with its own date, new maturity, fee charged, and notes. Users currently put this info in the notes field.

### Approach
Create a `loan_extensions` table to track each extension event, build a UI component to display/add them, and surface it in the Loan Detail page.

### Changes

**1. Database migration — `loan_extensions` table**
```sql
CREATE TABLE public.loan_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  extension_number int NOT NULL DEFAULT 1,
  extended_from date NOT NULL,
  extended_to date NOT NULL,
  extension_fee numeric DEFAULT 0,
  fee_percentage numeric DEFAULT NULL,
  notes text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.loan_extensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own loan extensions"
  ON public.loan_extensions FOR ALL TO authenticated
  USING (loan_id IN (SELECT id FROM public.loans WHERE user_id = auth.uid()))
  WITH CHECK (loan_id IN (SELECT id FROM public.loans WHERE user_id = auth.uid()));
```

**2. `src/hooks/useLoans.ts`** — Add extensions CRUD to `useLoanDetail`
- Query `loan_extensions` by `loan_id`, ordered by `extension_number`.
- Add `addExtension` and `deleteExtension` mutations.

**3. New `src/components/loans/LoanExtensions.tsx`**
- Card-based UI showing a timeline of extensions with:
  - Extension number, original maturity → new maturity, fee charged, notes
  - "Add Extension" button that opens an inline form with calendar pickers for dates, fee input, and optional notes
  - Delete option per extension
- Clean glass-card styling matching the rest of the loan detail page.

**4. `src/pages/LoanDetail.tsx`**
- Add an "Extensions" section to the Overview tab, below the existing cards (full-width, `md:col-span-2`).
- Also add an extension count indicator in the Loan Terms card next to Maturity Date when extensions exist (e.g., "Feb 8, 2026 (+2 ext)").

### UI Details
- Each extension row: card with left accent border, showing "Extension #1" header, date range, fee in bold, and notes in muted text.
- Add form uses calendar popovers for date selection (matching the draw funded date pattern).
- Empty state: subtle dashed border with "No extensions recorded" and an Add button.
