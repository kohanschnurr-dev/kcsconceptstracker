ALTER TABLE project_vendors
ADD COLUMN line_items jsonb NOT NULL DEFAULT '[]'::jsonb;