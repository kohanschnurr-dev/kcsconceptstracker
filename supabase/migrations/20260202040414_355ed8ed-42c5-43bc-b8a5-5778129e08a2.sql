-- Add 'final_punch' to budget_category enum
ALTER TYPE public.budget_category ADD VALUE IF NOT EXISTS 'final_punch';