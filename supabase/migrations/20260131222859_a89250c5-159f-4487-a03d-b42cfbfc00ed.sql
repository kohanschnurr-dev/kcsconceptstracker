-- Add photo_date column to track when photos were taken (separate from created_at which is upload time)
ALTER TABLE project_photos 
ADD COLUMN photo_date DATE DEFAULT CURRENT_DATE;