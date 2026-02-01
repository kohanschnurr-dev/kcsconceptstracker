-- Add original_amount column to preserve true bank transaction amount before SmartSplit overwrites it
ALTER TABLE quickbooks_expenses 
ADD COLUMN original_amount DECIMAL(12,2);