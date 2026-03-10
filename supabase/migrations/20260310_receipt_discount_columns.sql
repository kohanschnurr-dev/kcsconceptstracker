-- Add discount tracking and parsing confidence to receipt tables
-- These support the improved receipt scanning with Pro Xtra discount detection

-- Add discount_amount and parsing_confidence to pending_receipts
ALTER TABLE public.pending_receipts
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parsing_confidence TEXT DEFAULT 'high' CHECK (parsing_confidence IN ('high', 'medium', 'low'));

-- Add discount and original_price to receipt_line_items
ALTER TABLE public.receipt_line_items
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2);
