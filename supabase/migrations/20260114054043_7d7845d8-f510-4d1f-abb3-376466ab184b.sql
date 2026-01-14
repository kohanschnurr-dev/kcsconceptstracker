-- Remove the old check constraint that restricts event_category values
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_event_category_check;

-- The event_category column will now accept any text value, 
-- allowing the flexible DFW construction workflow categories defined in the frontend