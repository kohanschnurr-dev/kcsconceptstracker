-- Create company_settings table to store branding per user
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own company settings"
ON public.company_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own company settings"
ON public.company_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own company settings"
ON public.company_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own company logo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own company logo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete their own company logo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to company logos
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');