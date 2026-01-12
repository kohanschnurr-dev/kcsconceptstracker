-- Add 'wholesale_fee' to the budget_category enum
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'wholesale_fee';