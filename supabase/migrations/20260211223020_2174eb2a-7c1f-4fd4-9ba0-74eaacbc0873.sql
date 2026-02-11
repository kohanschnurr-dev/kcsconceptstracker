-- Add a JSONB column to profiles for storing all user settings (categories, palette, trade groups, etc.)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings_data JSONB DEFAULT '{}'::jsonb;