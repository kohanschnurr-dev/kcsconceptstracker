-- Add sqft column to store square footage with templates
ALTER TABLE budget_templates ADD COLUMN sqft integer;

-- Add is_default column to mark default startup template
ALTER TABLE budget_templates ADD COLUMN is_default boolean DEFAULT false;

-- Create function to ensure only one default per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE budget_templates 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce single default per user
CREATE TRIGGER ensure_single_default_budget_trigger
BEFORE INSERT OR UPDATE ON budget_templates
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_budget();