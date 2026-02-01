-- Add category text column to procurement_items for storing the item category type
ALTER TABLE public.procurement_items
ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';

-- Update existing items with detected categories based on name patterns
UPDATE procurement_items
SET category = CASE
  WHEN LOWER(name) LIKE '%door%' AND LOWER(name) NOT LIKE '%bathroom%' THEN 'doors'
  WHEN LOWER(name) LIKE '%floor%' OR LOWER(name) LIKE '%lvp%' OR LOWER(name) LIKE '%hardwood%' THEN 'flooring'
  WHEN LOWER(name) LIKE '%cabinet%' AND LOWER(name) NOT LIKE '%knob%' AND LOWER(name) NOT LIKE '%pull%' THEN 'cabinets'
  WHEN LOWER(name) LIKE '%knob%' OR LOWER(name) LIKE '%pull%' OR LOWER(name) LIKE '%hinge%' OR LOWER(name) LIKE '%handle%' THEN 'hardware'
  WHEN LOWER(name) LIKE '%light%' OR LOWER(name) LIKE '%fixture%' OR LOWER(name) LIKE '%chandelier%' OR LOWER(name) LIKE '%fan%' THEN 'lighting'
  WHEN LOWER(name) LIKE '%bathroom%' OR LOWER(name) LIKE '%vanity%' OR LOWER(name) LIKE '%mirror%' OR LOWER(name) LIKE '%shower%' OR LOWER(name) LIKE '%towel%' THEN 'bathroom'
  WHEN LOWER(name) LIKE '%faucet%' OR LOWER(name) LIKE '%toilet%' OR LOWER(name) LIKE '%sink%' THEN 'plumbing'
  WHEN LOWER(name) LIKE '%tile%' THEN 'tile'
  WHEN LOWER(name) LIKE '%mailbox%' THEN 'exterior_finishes'
  ELSE 'other'
END
WHERE category IS NULL OR category = 'other';