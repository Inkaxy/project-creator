-- =============================================
-- IK-MAT CHECKLIST MODULE
-- =============================================

-- Checklist templates (e.g., "Morning Opening", "Evening Closing", "Temperature Log")
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- 'opening', 'closing', 'temperature', 'hygiene', 'cleaning'
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  function_id UUID REFERENCES public.functions(id) ON DELETE SET NULL,
  frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'shift'
  is_required_for_clock_out BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Checklist items (individual tasks/checks within a template)
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT DEFAULT 'checkbox', -- 'checkbox', 'temperature', 'number', 'text', 'photo'
  min_value NUMERIC, -- For temperature/number validation
  max_value NUMERIC, -- For temperature/number validation
  unit TEXT, -- 'celsius', 'count', etc.
  is_critical BOOLEAN DEFAULT false, -- Critical items must be completed
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Checklist completions (when a checklist is filled out)
CREATE TABLE public.checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  status TEXT DEFAULT 'completed', -- 'completed', 'incomplete', 'flagged'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual item responses within a completion
CREATE TABLE public.checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID NOT NULL REFERENCES public.checklist_completions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  checked BOOLEAN DEFAULT false,
  value TEXT, -- For temperature, number, text inputs
  photo_url TEXT, -- For photo items
  notes TEXT,
  is_flagged BOOLEAN DEFAULT false, -- Flag items that are out of range
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(completion_id, item_id)
);

-- Enable RLS
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklist_templates
CREATE POLICY "Everyone can view active templates"
  ON public.checklist_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON public.checklist_templates FOR ALL
  USING (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for checklist_items
CREATE POLICY "Everyone can view items of active templates"
  ON public.checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.checklist_templates t
      WHERE t.id = template_id AND t.is_active = true
    )
  );

CREATE POLICY "Admins can manage items"
  ON public.checklist_items FOR ALL
  USING (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for checklist_completions
CREATE POLICY "Users can view their own completions"
  ON public.checklist_completions FOR SELECT
  USING (employee_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can create their own completions"
  ON public.checklist_completions FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can manage all completions"
  ON public.checklist_completions FOR ALL
  USING (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for checklist_responses
CREATE POLICY "Users can view responses of their completions"
  ON public.checklist_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.checklist_completions c
      WHERE c.id = completion_id AND (c.employee_id = auth.uid() OR public.is_admin_or_manager(auth.uid()))
    )
  );

CREATE POLICY "Users can create responses for their completions"
  ON public.checklist_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.checklist_completions c
      WHERE c.id = completion_id AND c.employee_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all responses"
  ON public.checklist_responses FOR ALL
  USING (public.is_admin_or_manager(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_checklist_items_template ON public.checklist_items(template_id);
CREATE INDEX idx_checklist_completions_employee ON public.checklist_completions(employee_id);
CREATE INDEX idx_checklist_completions_template ON public.checklist_completions(template_id);
CREATE INDEX idx_checklist_completions_shift ON public.checklist_completions(shift_id);
CREATE INDEX idx_checklist_responses_completion ON public.checklist_responses(completion_id);

-- Triggers for updated_at
CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data for IK-Mat templates
INSERT INTO public.checklist_templates (name, description, category, frequency, is_required_for_clock_out, sort_order) VALUES
  ('Åpningssjekk', 'Daglig sjekkliste før åpning', 'opening', 'daily', false, 1),
  ('Temperaturkontroll', 'Loggføring av temperaturer i kjøl og frys', 'temperature', 'daily', true, 2),
  ('Stengesjekk', 'Daglig sjekkliste ved stenging', 'closing', 'shift', true, 3),
  ('Renholdsplan', 'Ukentlig renholdsoppgaver', 'cleaning', 'weekly', false, 4);

-- Seed items for Temperature Control checklist
INSERT INTO public.checklist_items (template_id, title, description, item_type, min_value, max_value, unit, is_critical, sort_order)
SELECT 
  t.id,
  item.title,
  item.description,
  item.item_type,
  item.min_value,
  item.max_value,
  item.unit,
  item.is_critical,
  item.sort_order
FROM public.checklist_templates t
CROSS JOIN (VALUES
  ('Kjøleskap 1', 'Temperatur i hovedkjøleskap', 'temperature', 0, 4, 'celsius', true, 1),
  ('Kjøleskap 2', 'Temperatur i bakekjøleskap', 'temperature', 0, 4, 'celsius', true, 2),
  ('Fryser 1', 'Temperatur i hovedfryser', 'temperature', -25, -18, 'celsius', true, 3),
  ('Fryser 2', 'Temperatur i bakefryser', 'temperature', -25, -18, 'celsius', true, 4),
  ('Varmemonter', 'Temperatur i varmemonter', 'temperature', 60, 90, 'celsius', true, 5)
) AS item(title, description, item_type, min_value, max_value, unit, is_critical, sort_order)
WHERE t.name = 'Temperaturkontroll';

-- Seed items for Closing checklist
INSERT INTO public.checklist_items (template_id, title, description, item_type, is_critical, sort_order)
SELECT 
  t.id,
  item.title,
  item.description,
  'checkbox',
  item.is_critical,
  item.sort_order
FROM public.checklist_templates t
CROSS JOIN (VALUES
  ('Komfyr og stekeovn slått av', 'Sjekk at alt er avslått', true, 1),
  ('Kjøleskap og fryser lukket', 'Verifiser at dører er ordentlig lukket', true, 2),
  ('Gulv vasket', 'Daglig gulvvask i produksjonsområde', false, 3),
  ('Søppel tømt', 'Alle søppelbøtter tømt og nye poser', false, 4),
  ('Vinduer og dører låst', 'Sjekk alle innganger', true, 5),
  ('Alarm aktivert', 'Aktiver alarmsystemet', true, 6)
) AS item(title, description, is_critical, sort_order)
WHERE t.name = 'Stengesjekk';

-- Seed items for Opening checklist
INSERT INTO public.checklist_items (template_id, title, description, item_type, is_critical, sort_order)
SELECT 
  t.id,
  item.title,
  item.description,
  'checkbox',
  item.is_critical,
  item.sort_order
FROM public.checklist_templates t
CROSS JOIN (VALUES
  ('Alarm deaktivert', 'Deaktiver alarmsystemet', true, 1),
  ('Lys og ventilasjon på', 'Slå på alle lyskilder og ventilasjon', false, 2),
  ('Håndvask utført', 'Vask hender før arbeid', true, 3),
  ('Arbeidstøy på', 'Korrekt arbeidsuniform', false, 4),
  ('Utstyr rengjort', 'Sjekk at utstyr er rent fra dagen før', false, 5)
) AS item(title, description, is_critical, sort_order)
WHERE t.name = 'Åpningssjekk';