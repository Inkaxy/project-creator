-- IK-logging Control Points Module
-- Kontrollpunkter som kan fordeles pr avdeling

-- Control point templates (maler for kontrollpunkter)
CREATE TABLE public.ik_control_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- general, temperature, hygiene, safety, equipment
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  frequency TEXT DEFAULT 'daily', -- daily, weekly, monthly, shift
  time_of_day TEXT, -- morning, afternoon, evening, or specific time like "08:00"
  is_active BOOLEAN DEFAULT true,
  is_critical BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Control point items (individuelle kontrollpunkter i en mal)
CREATE TABLE public.ik_control_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.ik_control_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT DEFAULT 'checkbox', -- checkbox, number, text, temperature, photo
  min_value NUMERIC,
  max_value NUMERIC,
  unit TEXT,
  is_critical BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Control logs (fullførte kontroller)
CREATE TABLE public.ik_control_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.ik_control_templates(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'completed', -- completed, partial, flagged
  notes TEXT,
  has_deviations BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Control log responses (svar på individuelle kontrollpunkter)
CREATE TABLE public.ik_control_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.ik_control_logs(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.ik_control_items(id) ON DELETE CASCADE,
  checked BOOLEAN DEFAULT false,
  value TEXT,
  numeric_value NUMERIC,
  photo_url TEXT,
  notes TEXT,
  is_deviation BOOLEAN DEFAULT false,
  deviation_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ik_control_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_control_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_control_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_control_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view control templates"
  ON public.ik_control_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage control templates"
  ON public.ik_control_templates FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view control items"
  ON public.ik_control_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage control items"
  ON public.ik_control_items FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view control logs"
  ON public.ik_control_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create control logs"
  ON public.ik_control_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own logs"
  ON public.ik_control_logs FOR UPDATE
  USING (auth.uid() = logged_by);

CREATE POLICY "Authenticated users can view control responses"
  ON public.ik_control_responses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage control responses"
  ON public.ik_control_responses FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_ik_control_templates_dept ON public.ik_control_templates(department_id);
CREATE INDEX idx_ik_control_templates_active ON public.ik_control_templates(is_active);
CREATE INDEX idx_ik_control_items_template ON public.ik_control_items(template_id);
CREATE INDEX idx_ik_control_logs_template ON public.ik_control_logs(template_id);
CREATE INDEX idx_ik_control_logs_date ON public.ik_control_logs(scheduled_date);
CREATE INDEX idx_ik_control_logs_logged_by ON public.ik_control_logs(logged_by);
CREATE INDEX idx_ik_control_responses_log ON public.ik_control_responses(log_id);

-- Trigger for updated_at
CREATE TRIGGER update_ik_control_templates_updated_at
  BEFORE UPDATE ON public.ik_control_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();