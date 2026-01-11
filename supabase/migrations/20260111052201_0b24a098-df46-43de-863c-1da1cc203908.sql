-- Drop existing enum and create new one with updated categories
-- First, we need to handle the dependent tables

-- Create the new enum type
CREATE TYPE public.budget_category_new AS ENUM (
  'plumbing',
  'roofing',
  'misc',
  'flooring',
  'painting',
  'garage',
  'foundation_repair',
  'hvac',
  'drywall',
  'main_bathroom',
  'carpentry',
  'light_fixtures',
  'appliances',
  'natural_gas',
  'permits_inspections',
  'landscaping',
  'dumpsters_trash',
  'windows',
  'cabinets',
  'countertops',
  'bathroom',
  'electrical',
  'kitchen',
  'demolition',
  'fencing',
  'doors',
  'water_heater',
  'brick_siding_stucco',
  'framing',
  'hardware',
  'insulation',
  'pest_control',
  'pool'
);

-- Update project_categories to use the new enum
ALTER TABLE public.project_categories 
  ALTER COLUMN category TYPE public.budget_category_new 
  USING (
    CASE category::text
      WHEN 'foundation' THEN 'foundation_repair'
      WHEN 'plumbing' THEN 'plumbing'
      WHEN 'hvac' THEN 'hvac'
      WHEN 'electrical' THEN 'electrical'
      WHEN 'roof' THEN 'roofing'
      WHEN 'interior' THEN 'flooring'
      WHEN 'kitchen' THEN 'kitchen'
      WHEN 'fixtures' THEN 'light_fixtures'
      ELSE 'misc'
    END
  )::public.budget_category_new;

-- Drop old enum and rename new one
DROP TYPE public.budget_category;
ALTER TYPE public.budget_category_new RENAME TO budget_category;

-- Also update vendor_trade enum to match
CREATE TYPE public.vendor_trade_new AS ENUM (
  'plumbing',
  'roofing',
  'misc',
  'flooring',
  'painting',
  'garage',
  'foundation_repair',
  'hvac',
  'drywall',
  'main_bathroom',
  'carpentry',
  'light_fixtures',
  'appliances',
  'natural_gas',
  'permits_inspections',
  'landscaping',
  'dumpsters_trash',
  'windows',
  'cabinets',
  'countertops',
  'bathroom',
  'electrical',
  'kitchen',
  'demolition',
  'fencing',
  'doors',
  'water_heater',
  'brick_siding_stucco',
  'framing',
  'hardware',
  'insulation',
  'pest_control',
  'pool',
  'general'
);

ALTER TABLE public.vendors 
  ALTER COLUMN trade TYPE public.vendor_trade_new 
  USING (
    CASE trade::text
      WHEN 'foundation' THEN 'foundation_repair'
      WHEN 'plumbing' THEN 'plumbing'
      WHEN 'hvac' THEN 'hvac'
      WHEN 'electrical' THEN 'electrical'
      WHEN 'roof' THEN 'roofing'
      WHEN 'interior' THEN 'flooring'
      WHEN 'kitchen' THEN 'kitchen'
      WHEN 'fixtures' THEN 'light_fixtures'
      WHEN 'general' THEN 'general'
      ELSE 'misc'
    END
  )::public.vendor_trade_new;

DROP TYPE public.vendor_trade;
ALTER TYPE public.vendor_trade_new RENAME TO vendor_trade;