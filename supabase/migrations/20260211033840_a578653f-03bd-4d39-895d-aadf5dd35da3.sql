ALTER TABLE calendar_events 
  ADD COLUMN recurrence_rule text,
  ADD COLUMN recurrence_group_id uuid,
  ADD COLUMN recurrence_until date;