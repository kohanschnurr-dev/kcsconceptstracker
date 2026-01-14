-- Add notes column to business_expenses table
ALTER TABLE public.business_expenses 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add notes column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view receipts
CREATE POLICY "Anyone can view expense receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'expense-receipts');

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload expense receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their receipts
CREATE POLICY "Authenticated users can update expense receipts"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their receipts
CREATE POLICY "Authenticated users can delete expense receipts"
ON storage.objects
FOR DELETE
USING (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');