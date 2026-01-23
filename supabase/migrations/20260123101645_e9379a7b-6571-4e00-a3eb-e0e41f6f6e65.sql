-- Create settings table for application-wide settings
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Settings are readable by all authenticated users
CREATE POLICY "Settings are viewable by authenticated users"
ON public.settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify settings (we'll handle this in the app with employee_type check)
CREATE POLICY "Settings can be updated by admins"
ON public.settings
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Settings can be inserted by admins"
ON public.settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default setting for birthday visibility
INSERT INTO public.settings (key, value, description)
VALUES (
  'calendar_birthdays_visibility',
  '"managers_only"'::jsonb,
  'Who can see employee birthdays in the calendar: "all" or "managers_only"'
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();