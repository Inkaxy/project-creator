-- Kategorier for disiplinærsaker
CREATE TABLE public.disciplinary_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed standard kategorier
INSERT INTO public.disciplinary_categories (name, description, icon, sort_order) VALUES
  ('For sent oppmøte', 'Ansatt stempler inn etter planlagt starttid', 'Clock', 1),
  ('Manglende utstempling', 'Ansatt glemmer å stemple ut', 'LogOut', 2),
  ('Umeldt fravær', 'Ansatt møter ikke uten å gi beskjed (no-show)', 'UserX', 3),
  ('Rutiner og sjekklister', 'Manglende utførelse av pålagte oppgaver', 'ClipboardList', 4),
  ('HMS-brudd', 'Brudd på sikkerhetsrutiner eller HMS-regler', 'ShieldAlert', 5),
  ('Oppførsel', 'Utilbørlig oppførsel mot kolleger eller kunder', 'MessageCircleWarning', 6),
  ('Annet', 'Andre forhold som krever oppfølging', 'AlertTriangle', 7);

-- Alvorlighetsgrader
CREATE TYPE disciplinary_severity AS ENUM ('low', 'medium', 'high');

-- Disiplinærsaker
CREATE TABLE public.disciplinary_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(20) NOT NULL UNIQUE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.disciplinary_categories(id),
  severity disciplinary_severity NOT NULL DEFAULT 'low',
  
  incident_date DATE NOT NULL,
  incident_time TIME,
  incident_description TEXT NOT NULL,
  incident_location VARCHAR(200),
  
  warning_type VARCHAR(50) NOT NULL,
  consequences_description TEXT,
  improvement_expectations TEXT,
  
  expiry_date DATE,
  retention_reason TEXT,
  
  blocks_clock_in BOOLEAN DEFAULT false,
  blocks_timesheet BOOLEAN DEFAULT false,
  block_until_acknowledged BOOLEAN DEFAULT true,
  
  status VARCHAR(30) DEFAULT 'draft',
  
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);

-- Automatisk saksnummer
CREATE OR REPLACE FUNCTION generate_disciplinary_case_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part VARCHAR(4);
  seq_num INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(case_number FROM 'DIS-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.disciplinary_cases
  WHERE case_number LIKE 'DIS-' || year_part || '-%';
  
  NEW.case_number := 'DIS-' || year_part || '-' || LPAD(seq_num::VARCHAR, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_disciplinary_case_number
  BEFORE INSERT ON public.disciplinary_cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL)
  EXECUTE FUNCTION generate_disciplinary_case_number();

-- Vitner og involverte
CREATE TABLE public.disciplinary_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.disciplinary_cases(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id),
  external_name VARCHAR(200),
  external_contact VARCHAR(200),
  role VARCHAR(50) NOT NULL,
  statement TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vedlegg og dokumentasjon
CREATE TABLE public.disciplinary_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.disciplinary_cases(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Ansattes tilsvar/kvittering
CREATE TABLE public.disciplinary_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.disciplinary_cases(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id),
  response_type VARCHAR(30) NOT NULL,
  comment TEXT,
  signature_data TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  responded_at TIMESTAMPTZ DEFAULT now()
);

-- Møter og samtaler
CREATE TABLE public.disciplinary_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.disciplinary_cases(id) ON DELETE CASCADE,
  meeting_type VARCHAR(50) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location VARCHAR(200),
  
  employee_id UUID NOT NULL REFERENCES public.profiles(id),
  manager_id UUID NOT NULL REFERENCES public.profiles(id),
  hr_representative_id UUID REFERENCES public.profiles(id),
  union_representative_id UUID REFERENCES public.profiles(id),
  employee_companion_name VARCHAR(200),
  
  agenda TEXT,
  minutes TEXT,
  outcome TEXT,
  follow_up_actions TEXT,
  
  status VARCHAR(30) DEFAULT 'scheduled',
  completed_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Historikk/audit log
CREATE TABLE public.disciplinary_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.disciplinary_cases(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID NOT NULL REFERENCES public.profiles(id),
  performed_at TIMESTAMPTZ DEFAULT now(),
  ip_address VARCHAR(45)
);

-- Automatiske regler for forslag til disiplinærsaker
CREATE TABLE public.disciplinary_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.disciplinary_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  threshold_count INTEGER NOT NULL,
  threshold_days INTEGER NOT NULL,
  
  requires_previous_warning BOOLEAN DEFAULT false,
  required_previous_severity disciplinary_severity,
  required_previous_days INTEGER,
  
  suggested_severity disciplinary_severity NOT NULL,
  suggested_warning_type VARCHAR(50) NOT NULL,
  
  suggest_block_clock_in BOOLEAN DEFAULT false,
  suggest_block_timesheet BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Systemhendelser som kan trigge forslag
CREATE TABLE public.disciplinary_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id),
  category_id UUID NOT NULL REFERENCES public.disciplinary_categories(id),
  incident_date DATE NOT NULL,
  incident_time TIME,
  
  source_type VARCHAR(50) NOT NULL,
  source_id UUID,
  
  details JSONB,
  
  processed BOOLEAN DEFAULT false,
  case_id UUID REFERENCES public.disciplinary_cases(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indekser
CREATE INDEX idx_disciplinary_cases_employee ON public.disciplinary_cases(employee_id);
CREATE INDEX idx_disciplinary_cases_status ON public.disciplinary_cases(status);
CREATE INDEX idx_disciplinary_cases_severity ON public.disciplinary_cases(severity);
CREATE INDEX idx_disciplinary_cases_created ON public.disciplinary_cases(created_at DESC);
CREATE INDEX idx_disciplinary_cases_expiry ON public.disciplinary_cases(expiry_date);
CREATE INDEX idx_disciplinary_audit_case ON public.disciplinary_audit_log(case_id);
CREATE INDEX idx_disciplinary_incidents_employee ON public.disciplinary_incidents(employee_id);
CREATE INDEX idx_disciplinary_incidents_category ON public.disciplinary_incidents(category_id);
CREATE INDEX idx_disciplinary_incidents_date ON public.disciplinary_incidents(incident_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_disciplinary_cases_updated_at
  BEFORE UPDATE ON public.disciplinary_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disciplinary_meetings_updated_at
  BEFORE UPDATE ON public.disciplinary_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disciplinary_rules_updated_at
  BEFORE UPDATE ON public.disciplinary_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for audit logging
CREATE OR REPLACE FUNCTION log_disciplinary_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.disciplinary_audit_log (case_id, action, description, new_values, performed_by)
    VALUES (NEW.id, 'created', 'Sak opprettet', to_jsonb(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.disciplinary_audit_log (case_id, action, description, old_values, new_values, performed_by)
    VALUES (NEW.id, 'updated', 'Sak oppdatert', to_jsonb(OLD), to_jsonb(NEW), COALESCE(NEW.reviewed_by, NEW.created_by));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER audit_disciplinary_cases
  AFTER INSERT OR UPDATE ON public.disciplinary_cases
  FOR EACH ROW
  EXECUTE FUNCTION log_disciplinary_change();

-- Enable RLS
ALTER TABLE public.disciplinary_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_incidents ENABLE ROW LEVEL SECURITY;

-- Kategorier: alle kan se
CREATE POLICY "Anyone can view categories"
  ON public.disciplinary_categories FOR SELECT
  TO authenticated USING (true);

-- Regler: ledere kan se og endre
CREATE POLICY "Managers can view rules"
  ON public.disciplinary_rules FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can manage rules"
  ON public.disciplinary_rules FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Saker: ledere kan se alle, ansatte kan se egne
CREATE POLICY "Managers can view all cases"
  ON public.disciplinary_cases FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view own cases"
  ON public.disciplinary_cases FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() AND status != 'draft');

CREATE POLICY "Managers can manage cases"
  ON public.disciplinary_cases FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Witnesses policies
CREATE POLICY "Managers can manage witnesses"
  ON public.disciplinary_witnesses FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view witnesses of own cases"
  ON public.disciplinary_witnesses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.disciplinary_cases c 
    WHERE c.id = case_id AND c.employee_id = auth.uid() AND c.status != 'draft'
  ));

-- Attachments policies
CREATE POLICY "Managers can manage attachments"
  ON public.disciplinary_attachments FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view attachments of own cases"
  ON public.disciplinary_attachments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.disciplinary_cases c 
    WHERE c.id = case_id AND c.employee_id = auth.uid() AND c.status != 'draft'
  ));

-- Responses: ansatt kan lage egen respons
CREATE POLICY "Employees can respond to own cases"
  ON public.disciplinary_responses FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can view responses"
  ON public.disciplinary_responses FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()) OR employee_id = auth.uid());

-- Meetings policies
CREATE POLICY "Managers can manage meetings"
  ON public.disciplinary_meetings FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view own meetings"
  ON public.disciplinary_meetings FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Audit log: kun ledere
CREATE POLICY "Managers can view audit log"
  ON public.disciplinary_audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- Hendelser: kun ledere
CREATE POLICY "Managers can view incidents"
  ON public.disciplinary_incidents FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can manage incidents"
  ON public.disciplinary_incidents FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));