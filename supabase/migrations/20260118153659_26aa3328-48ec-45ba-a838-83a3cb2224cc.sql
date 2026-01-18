-- Create shift_templates table
CREATE TABLE public.shift_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template_shifts table
CREATE TABLE public.template_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.shift_templates(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  function_id UUID NOT NULL REFERENCES public.functions(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 30,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_shifts ENABLE ROW LEVEL SECURITY;

-- RLS policies for shift_templates
CREATE POLICY "Authenticated users can view shift templates"
  ON public.shift_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can create shift templates"
  ON public.shift_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can update shift templates"
  ON public.shift_templates
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can delete shift templates"
  ON public.shift_templates
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- RLS policies for template_shifts
CREATE POLICY "Authenticated users can view template shifts"
  ON public.template_shifts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can create template shifts"
  ON public.template_shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can update template shifts"
  ON public.template_shifts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can delete template shifts"
  ON public.template_shifts
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_shift_templates_updated_at
  BEFORE UPDATE ON public.shift_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_template_shifts_template_id ON public.template_shifts(template_id);
CREATE INDEX idx_template_shifts_function_id ON public.template_shifts(function_id);
CREATE INDEX idx_shift_templates_is_default ON public.shift_templates(is_default) WHERE is_default = true;