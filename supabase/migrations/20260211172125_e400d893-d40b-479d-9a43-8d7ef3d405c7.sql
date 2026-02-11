-- Add new enum values for permits and inspections
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'permits';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'inspections';

-- Also add to vendor_trade enum
ALTER TYPE vendor_trade ADD VALUE IF NOT EXISTS 'permits';
ALTER TYPE vendor_trade ADD VALUE IF NOT EXISTS 'inspections';