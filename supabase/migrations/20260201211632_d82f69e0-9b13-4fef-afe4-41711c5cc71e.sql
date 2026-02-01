-- Add HOA column to projects table for rental cash flow calculator
ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_hoa numeric DEFAULT 0;