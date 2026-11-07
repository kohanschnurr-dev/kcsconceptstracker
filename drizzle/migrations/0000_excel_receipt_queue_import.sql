ALTER TABLE public.pending_receipts ADD COLUMN IF NOT EXISTS spreadsheet_import_key text;
CREATE UNIQUE INDEX IF NOT EXISTS pending_receipts_spreadsheet_import_unique ON public.pending_receipts(user_id, spreadsheet_import_key) WHERE spreadsheet_import_key IS NOT NULL;
CREATE OR REPLACE FUNCTION public.import_spreadsheet_receipts(p_receipts jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE r jsonb; i jsonb; receipt_id uuid; imported integer := 0; skipped integer := 0; item_subtotal numeric; item_tax numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to upload receipts'; END IF;
  IF jsonb_typeof(p_receipts) IS DISTINCT FROM 'array' OR jsonb_array_length(p_receipts) < 1 OR jsonb_array_length(p_receipts) > 500 THEN RAISE EXCEPTION 'Select between 1 and 500 receipts'; END IF;
  FOR r IN SELECT value FROM jsonb_array_elements(p_receipts) LOOP
    IF coalesce(length(r->>'import_key'), 0) NOT BETWEEN 1 AND 500 OR coalesce(length(r->>'vendor_name'), 0) NOT BETWEEN 1 AND 255 OR jsonb_typeof(r->'items') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid receipt'; END IF;
    IF jsonb_array_length(r->'items') NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid receipt items'; END IF;
    SELECT round(sum((value->>'total_price')::numeric),2), round(sum(coalesce((value->>'tax')::numeric,0)),2) INTO item_subtotal,item_tax FROM jsonb_array_elements(r->'items');
    receipt_id := NULL;
    INSERT INTO public.pending_receipts(user_id,vendor_name,total_amount,tax_amount,subtotal,purchase_date,raw_text,status,spreadsheet_import_key)
    VALUES(auth.uid(),r->>'vendor_name',item_subtotal+item_tax,item_tax,item_subtotal,(r->>'purchase_date')::date,r->>'raw_text','pending',r->>'import_key')
    ON CONFLICT (user_id,spreadsheet_import_key) WHERE spreadsheet_import_key IS NOT NULL DO NOTHING RETURNING id INTO receipt_id;
    IF receipt_id IS NULL THEN skipped := skipped+1; CONTINUE; END IF;
    FOR i IN SELECT value FROM jsonb_array_elements(r->'items') LOOP
      IF coalesce(length(i->>'item_name'),0) NOT BETWEEN 1 AND 2000 OR (i->>'quantity')::numeric <= 0 OR (i->>'total_price') IS NULL THEN RAISE EXCEPTION 'Invalid line item'; END IF;
      INSERT INTO public.receipt_line_items(receipt_id,item_name,quantity,unit_price,total_price,suggested_category,notes)
      VALUES(receipt_id,i->>'item_name',(i->>'quantity')::numeric,(i->>'unit_price')::numeric,(i->>'total_price')::numeric,coalesce(i->>'suggested_category','misc'),i->>'notes');
    END LOOP;
    imported := imported+1;
  END LOOP;
  RETURN jsonb_build_object('imported',imported,'skipped',skipped);
END;
$$;
REVOKE ALL ON FUNCTION public.import_spreadsheet_receipts(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_spreadsheet_receipts(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_spreadsheet_receipts(jsonb) TO service_role;