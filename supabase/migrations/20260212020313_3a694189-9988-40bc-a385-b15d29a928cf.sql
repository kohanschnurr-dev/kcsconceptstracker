ALTER TABLE public.expenses DROP CONSTRAINT expenses_expense_type_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_expense_type_check
  CHECK (expense_type = ANY (ARRAY['product', 'labor', 'loan', 'monthly']));