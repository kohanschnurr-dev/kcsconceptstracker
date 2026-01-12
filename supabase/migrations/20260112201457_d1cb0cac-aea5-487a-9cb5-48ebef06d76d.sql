-- Add drain line repair category
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'drain_line_repair';
ALTER TYPE vendor_trade ADD VALUE IF NOT EXISTS 'drain_line_repair';