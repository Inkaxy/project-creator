
-- Create deviation_types table
CREATE TABLE public.deviation_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  salary_type_id UUID REFERENCES public.salary_types(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#6B7280',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  affects_time_bank BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create time_entry_lines table
CREATE TABLE public.time_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_entry_id UUID NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  deviation_type_id UUID NOT NULL REFERENCES public.deviation_types(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  salary_type_id UUID REFERENCES public.salary_types(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deviation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entry_lines ENABLE ROW LEVEL SECURITY;

-- RLS for deviation_types: all authenticated can read, admins can manage
CREATE POLICY "Authenticated users can view deviation types"
  ON public.deviation_types FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage deviation types"
  ON public.deviation_types FOR ALL TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- RLS for time_entry_lines: all authenticated can read, admins can manage
CREATE POLICY "Authenticated users can view time entry lines"
  ON public.time_entry_lines FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage time entry lines"
  ON public.time_entry_lines FOR ALL TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Seed default deviation types
INSERT INTO public.deviation_types (name, code, color, sort_order, is_system, affects_time_bank) VALUES
  ('Normal', 'normal', '#22C55E', 0, true, false),
  ('Plusstid 50%', 'overtime_50', '#F59E0B', 1, true, false),
  ('Plusstid 100%', 'overtime_100', '#EF4444', 2, true, false),
  ('Tidsbank', 'time_bank', '#3B82F6', 3, true, true),
  ('Avspasering', 'comp_time', '#8B5CF6', 4, true, false);

-- Add updated_at trigger
CREATE TRIGGER update_deviation_types_updated_at
  BEFORE UPDATE ON public.deviation_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
