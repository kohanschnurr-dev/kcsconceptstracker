-- Add new construction budget categories
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'cleaning_final_punch';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'closing_costs';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'driveway_concrete';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'food';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'hoa';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'insurance_project';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'railing';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'staging';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'taxes';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'tile';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'utilities';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'variable';

-- Also add to vendor_trade enum so vendors can specialize in these
ALTER TYPE vendor_trade ADD VALUE IF NOT EXISTS 'cleaning_final_punch';
ALTER TYPE vendor_trade ADD VALUE IF NOT EXISTS 'driveway_concrete';
ALTER TYPE vendor_trade ADD VALUE IF NOT EXISTS 'railing';
ALTER TYPE vendor_trade ADD VALUE IF NOT EXISTS 'staging';
ALTER TYPE vendor_trade ADD VALUE IF NOT EXISTS 'tile';