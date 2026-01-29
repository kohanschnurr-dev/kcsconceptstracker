-- SmartSplit Receipt Reconciliation Tables

-- Pending Receipts table - stores receipts waiting for QB transaction match
CREATE TABLE public.pending_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  subtotal NUMERIC(12,2),
  purchase_date DATE NOT NULL,
  receipt_image_url TEXT,
  raw_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'imported', 'expired')),
  matched_qb_id TEXT,
  matched_at TIMESTAMP WITH TIME ZONE,
  match_confidence NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Receipt Line Items table - individual items from each receipt
CREATE TABLE public.receipt_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.pending_receipts(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  suggested_category TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.project_categories(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_receipts
CREATE POLICY "Users can view their own pending receipts"
  ON public.pending_receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending receipts"
  ON public.pending_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending receipts"
  ON public.pending_receipts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending receipts"
  ON public.pending_receipts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for receipt_line_items (through parent receipt ownership)
CREATE POLICY "Users can view their own receipt line items"
  ON public.receipt_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pending_receipts pr
    WHERE pr.id = receipt_line_items.receipt_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can create line items for their receipts"
  ON public.receipt_line_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pending_receipts pr
    WHERE pr.id = receipt_line_items.receipt_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update line items for their receipts"
  ON public.receipt_line_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.pending_receipts pr
    WHERE pr.id = receipt_line_items.receipt_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete line items for their receipts"
  ON public.receipt_line_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.pending_receipts pr
    WHERE pr.id = receipt_line_items.receipt_id AND pr.user_id = auth.uid()
  ));

-- Updated at trigger for pending_receipts
CREATE TRIGGER update_pending_receipts_updated_at
  BEFORE UPDATE ON public.pending_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_pending_receipts_user_status ON public.pending_receipts(user_id, status);
CREATE INDEX idx_pending_receipts_vendor_amount ON public.pending_receipts(vendor_name, total_amount);
CREATE INDEX idx_pending_receipts_purchase_date ON public.pending_receipts(purchase_date);
CREATE INDEX idx_receipt_line_items_receipt_id ON public.receipt_line_items(receipt_id);