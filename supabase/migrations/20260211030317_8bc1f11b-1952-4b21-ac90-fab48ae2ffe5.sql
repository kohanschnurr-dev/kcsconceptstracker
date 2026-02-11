
ALTER TABLE public.procurement_items DROP CONSTRAINT IF EXISTS procurement_items_phase_check;
ALTER TABLE public.procurement_items ADD CONSTRAINT procurement_items_phase_check CHECK (phase IN ('demo', 'rough_in', 'drywall', 'trim_out', 'finish', 'punch', 'final'));

ALTER TABLE public.procurement_items DROP CONSTRAINT IF EXISTS procurement_items_status_check;
ALTER TABLE public.procurement_items ADD CONSTRAINT procurement_items_status_check CHECK (status IN ('researching', 'in_cart', 'ordered', 'delivered', 'shipped', 'on_site', 'installed'));
