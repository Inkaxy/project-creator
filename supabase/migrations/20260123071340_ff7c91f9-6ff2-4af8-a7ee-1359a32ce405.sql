-- ============================================================
-- SYKEFRAVÆR (sick_leaves)
-- ============================================================
CREATE TABLE public.sick_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Kobling
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Periode
  start_date DATE NOT NULL,
  end_date DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  
  -- Type og dokumentasjon
  leave_type TEXT NOT NULL CHECK (leave_type IN (
    'egenmelding',
    'sykemelding',
    'gradert_sykemelding',
    'arbeidsrelatert_sykdom'
  )),
  sick_leave_percentage INTEGER DEFAULT 100,
  
  -- Diagnose (valgfritt, GDPR-sensitiv)
  diagnosis_code TEXT,
  diagnosis_category TEXT,
  
  -- Arbeidsgiverperiode
  employer_period_start DATE,
  employer_period_end DATE,
  employer_period_days_used INTEGER DEFAULT 0,
  employer_period_completed BOOLEAN DEFAULT false,
  
  -- NAV-relatert
  nav_takeover_date DATE,
  nav_case_number TEXT,
  income_report_sent_at TIMESTAMPTZ,
  
  -- Oppfølging
  follow_up_plan_due DATE,
  follow_up_plan_completed_at TIMESTAMPTZ,
  dialogue_meeting_1_due DATE,
  dialogue_meeting_1_completed_at TIMESTAMPTZ,
  activity_requirement_due DATE,
  activity_requirement_met BOOLEAN,
  dialogue_meeting_2_due DATE,
  dialogue_meeting_2_completed_at TIMESTAMPTZ,
  max_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active',
    'completed',
    'extended',
    'cancelled'
  )),
  
  -- Notater
  notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SYKEFRAVÆR-DAGER (sick_leave_days)
-- ============================================================
CREATE TABLE public.sick_leave_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sick_leave_id UUID NOT NULL REFERENCES sick_leaves(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_type TEXT NOT NULL CHECK (day_type IN (
    'sick',
    'sick_weekend',
    'partial_work',
    'holiday',
    'vacation'
  )),
  work_percentage INTEGER,
  is_employer_period BOOLEAN DEFAULT false,
  employer_period_day_number INTEGER,
  documentation_type TEXT CHECK (documentation_type IN (
    'egenmelding',
    'sykemelding',
    'ingen'
  )),
  shift_id UUID REFERENCES shifts(id),
  planned_hours DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EGENMELDINGSKVOTER (self_certification_quotas)
-- ============================================================
CREATE TABLE public.self_certification_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quota_type TEXT NOT NULL CHECK (quota_type IN ('standard', 'ia')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days_used INTEGER DEFAULT 0,
  occurrences_used INTEGER DEFAULT 0,
  max_days_per_occurrence INTEGER,
  max_days_per_period INTEGER,
  max_occurrences_per_period INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, period_start)
);

-- ============================================================
-- OPPFØLGINGSHENDELSER (follow_up_events)
-- ============================================================
CREATE TABLE public.follow_up_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sick_leave_id UUID NOT NULL REFERENCES sick_leaves(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'follow_up_plan_created',
    'follow_up_plan_updated',
    'follow_up_plan_sent',
    'dialogue_meeting_1_scheduled',
    'dialogue_meeting_1_held',
    'dialogue_meeting_1_cancelled',
    'activity_requirement_checked',
    'dialogue_meeting_2_scheduled',
    'dialogue_meeting_2_held',
    'nav_contact',
    'accommodation_made',
    'return_to_work',
    'extension',
    'note_added'
  )),
  event_date DATE NOT NULL,
  event_time TIME,
  description TEXT,
  participants JSONB,
  document_id UUID,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SYKEFRAVÆRSINNSTILLINGER (sick_leave_settings)
-- ============================================================
CREATE TABLE public.sick_leave_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  has_ia_agreement BOOLEAN DEFAULT false,
  ia_agreement_start_date DATE,
  ia_agreement_end_date DATE,
  self_cert_quota_type TEXT DEFAULT 'standard' CHECK (self_cert_quota_type IN ('standard', 'ia', 'custom')),
  self_cert_max_days_per_occurrence INTEGER DEFAULT 3,
  self_cert_max_days_per_year INTEGER DEFAULT 12,
  self_cert_max_occurrences INTEGER DEFAULT 4,
  notify_hr_on_sick_leave BOOLEAN DEFAULT true,
  notify_manager_on_sick_leave BOOLEAN DEFAULT true,
  notify_days_before_deadline INTEGER DEFAULT 3,
  require_return_conversation BOOLEAN DEFAULT true,
  auto_create_follow_up_plan BOOLEAN DEFAULT true,
  use_actual_hourly_rate BOOLEAN DEFAULT true,
  default_hourly_rate DECIMAL(8,2) DEFAULT 250.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indekser for ytelse
-- ============================================================
CREATE INDEX idx_sick_leaves_employee ON sick_leaves(employee_id);
CREATE INDEX idx_sick_leaves_status ON sick_leaves(status);
CREATE INDEX idx_sick_leaves_dates ON sick_leaves(start_date, end_date);
CREATE INDEX idx_sick_leave_days_date ON sick_leave_days(date);
CREATE INDEX idx_sick_leave_days_sick_leave ON sick_leave_days(sick_leave_id);
CREATE INDEX idx_self_cert_employee ON self_certification_quotas(employee_id);
CREATE INDEX idx_follow_up_events_sick_leave ON follow_up_events(sick_leave_id);

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE public.sick_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sick_leave_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_certification_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sick_leave_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies for sick_leaves
-- ============================================================
CREATE POLICY "Users can view their own sick leaves"
ON public.sick_leaves FOR SELECT
USING (auth.uid() = employee_id);

CREATE POLICY "Admins can view all sick leaves"
ON public.sick_leaves FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

CREATE POLICY "Admins can insert sick leaves"
ON public.sick_leaves FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

CREATE POLICY "Admins can update sick leaves"
ON public.sick_leaves FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

-- ============================================================
-- RLS Policies for sick_leave_days
-- ============================================================
CREATE POLICY "Users can view their own sick leave days"
ON public.sick_leave_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sick_leaves
    WHERE sick_leaves.id = sick_leave_days.sick_leave_id
    AND sick_leaves.employee_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all sick leave days"
ON public.sick_leave_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

CREATE POLICY "Admins can manage sick leave days"
ON public.sick_leave_days FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

-- ============================================================
-- RLS Policies for self_certification_quotas
-- ============================================================
CREATE POLICY "Users can view their own quotas"
ON public.self_certification_quotas FOR SELECT
USING (auth.uid() = employee_id);

CREATE POLICY "Admins can view all quotas"
ON public.self_certification_quotas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

CREATE POLICY "Admins can manage quotas"
ON public.self_certification_quotas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

-- ============================================================
-- RLS Policies for follow_up_events
-- ============================================================
CREATE POLICY "Users can view their own follow-up events"
ON public.follow_up_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sick_leaves
    WHERE sick_leaves.id = follow_up_events.sick_leave_id
    AND sick_leaves.employee_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all follow-up events"
ON public.follow_up_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

CREATE POLICY "Admins can manage follow-up events"
ON public.follow_up_events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

-- ============================================================
-- RLS Policies for sick_leave_settings
-- ============================================================
CREATE POLICY "Admins can view sick leave settings"
ON public.sick_leave_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
  )
);

CREATE POLICY "Superadmins can manage sick leave settings"
ON public.sick_leave_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
  )
);

-- ============================================================
-- Insert default settings
-- ============================================================
INSERT INTO public.sick_leave_settings (
  has_ia_agreement,
  self_cert_quota_type,
  self_cert_max_days_per_occurrence,
  self_cert_max_days_per_year,
  self_cert_max_occurrences
) VALUES (
  false,
  'standard',
  3,
  12,
  4
);

-- ============================================================
-- Trigger: Updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_sick_leaves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sick_leaves_updated_at
BEFORE UPDATE ON sick_leaves
FOR EACH ROW
EXECUTE FUNCTION update_sick_leaves_updated_at();