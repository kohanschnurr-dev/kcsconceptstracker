-- Create calendar_events table for project-specific events
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('inspection', 'quote', 'trade_start', 'material_delivery', 'city_inspection')),
  trade TEXT CHECK (trade IN ('demo', 'plumbing', 'electrical', 'structural', 'hvac', 'drywall', 'finish', 'general')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_critical_path BOOLEAN NOT NULL DEFAULT false,
  lead_time_days INTEGER DEFAULT 0,
  expected_date DATE,
  notes TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar events" 
ON public.calendar_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" 
ON public.calendar_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" 
ON public.calendar_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();