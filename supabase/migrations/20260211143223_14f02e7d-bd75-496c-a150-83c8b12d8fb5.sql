ALTER TABLE quarterly_goals
  ADD COLUMN start_date date,
  ADD COLUMN due_date date,
  ADD COLUMN completed_at timestamptz;