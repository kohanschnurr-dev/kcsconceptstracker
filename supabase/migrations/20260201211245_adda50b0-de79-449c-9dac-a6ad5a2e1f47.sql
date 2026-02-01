-- Add rental-specific columns to projects table for cash flow calculator
ALTER TABLE projects ADD COLUMN IF NOT EXISTS monthly_rent numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS loan_amount numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS interest_rate numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS loan_term_years integer DEFAULT 30;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_property_taxes numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_insurance numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS vacancy_rate numeric DEFAULT 8;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS monthly_maintenance numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS management_rate numeric DEFAULT 10;