-- Create wage_supplements table for configurable supplement rules
CREATE TABLE public.wage_supplements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  supplement_type TEXT NOT NULL CHECK (supplement_type IN ('percentage', 'fixed')),
  amount DECIMAL(10,2) NOT NULL,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('night', 'weekend', 'holiday', 'evening')),
  time_start TIME,
  time_end TIME,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wage_supplements ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can manage, everyone can view
CREATE POLICY "Admins can manage wage_supplements" 
ON public.wage_supplements 
FOR ALL 
USING (is_admin_or_manager(auth.uid()))
WITH CHECK (is_admin_or_manager(auth.uid()));

CREATE POLICY "Anyone authenticated can view wage_supplements" 
ON public.wage_supplements 
FOR SELECT 
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_wage_supplements_updated_at
BEFORE UPDATE ON public.wage_supplements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Norwegian supplement rules
INSERT INTO public.wage_supplements (name, description, supplement_type, amount, applies_to, time_start, time_end, priority) VALUES
  ('Nattillegg', 'Tillegg for arbeid mellom 21:00 og 06:00', 'fixed', 65.00, 'night', '21:00', '06:00', 1),
  ('Kveldstillegg', 'Tillegg for arbeid mellom 17:00 og 21:00', 'fixed', 35.00, 'evening', '17:00', '21:00', 2),
  ('Helgetillegg lørdag', 'Tillegg for arbeid på lørdag', 'fixed', 50.00, 'weekend', NULL, NULL, 3),
  ('Helgetillegg søndag', 'Tillegg for arbeid på søndag', 'fixed', 100.00, 'weekend', NULL, NULL, 4),
  ('Helligdagstillegg', '100% tillegg for arbeid på helligdager', 'percentage', 100.00, 'holiday', NULL, NULL, 5);