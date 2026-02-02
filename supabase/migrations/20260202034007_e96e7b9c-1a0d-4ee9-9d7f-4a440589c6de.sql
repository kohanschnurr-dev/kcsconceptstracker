-- Clean up orphan parent QuickBooks records where splits already exist
-- This removes duplicate parent records that were recreated after SmartSplit
DELETE FROM quickbooks_expenses parent
WHERE parent.is_imported = false 
  AND parent.qb_id NOT LIKE '%_split_%'
  AND EXISTS (
    SELECT 1 
    FROM quickbooks_expenses splits 
    WHERE splits.qb_id LIKE parent.qb_id || '_split_%'
      AND splits.user_id = parent.user_id
  );