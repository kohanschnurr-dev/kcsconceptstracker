ALTER TABLE public.pending_receipts DROP CONSTRAINT pending_receipts_status_check;
ALTER TABLE public.pending_receipts ADD CONSTRAINT pending_receipts_status_check 
  CHECK (status IN ('pending', 'matched', 'approved', 'rejected', 'parsing', 'failed', 'imported'));