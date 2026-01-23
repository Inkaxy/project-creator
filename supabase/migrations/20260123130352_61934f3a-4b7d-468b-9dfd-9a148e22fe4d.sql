-- Create kiosk_settings table for storing kiosk configuration
CREATE TABLE public.kiosk_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT DEFAULT 'Crewplan',
  company_logo_url TEXT,
  show_clock_seconds BOOLEAN DEFAULT true,
  require_pin_for_all BOOLEAN DEFAULT false,
  auto_logout_seconds INTEGER DEFAULT 30,
  show_planned_shifts BOOLEAN DEFAULT true,
  show_active_workers BOOLEAN DEFAULT true,
  show_all_employees BOOLEAN DEFAULT true,
  allow_clock_without_shift BOOLEAN DEFAULT true,
  primary_color TEXT DEFAULT '#10B981',
  welcome_message TEXT DEFAULT 'Velkommen!',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kiosk_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - allow anyone to read (kiosk is public), only admins can update
CREATE POLICY "Anyone can read kiosk settings" 
ON public.kiosk_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage kiosk settings" 
ON public.kiosk_settings 
FOR ALL 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Insert default settings row
INSERT INTO public.kiosk_settings (id) VALUES (gen_random_uuid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_kiosk_settings_updated_at
BEFORE UPDATE ON public.kiosk_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();