
-- =============================================
-- INDUSTRIVERN MODULE - ENUMS
-- =============================================

CREATE TYPE public.industrivern_role AS ENUM (
  'industrivernleder',
  'fagleder_industrivern', 
  'innsatsperson',
  'redningsstab',
  'orden_sikring',
  'forstehjelp',
  'brannvern',
  'miljo_kjemikalievern',
  'kjemikaliedykker',
  'roykdykker'
);

CREATE TYPE public.exercise_type AS ENUM (
  'diskusjonsovelse',
  'delovelse',
  'praktisk',
  'fullskala',
  'reell_hendelse'
);

CREATE TYPE public.iv_equipment_category AS ENUM (
  'personlig_verneutstyr',
  'forstehjelp',
  'brannvern',
  'kjemikalievern',
  'kommunikasjon',
  'annet'
);

-- =============================================
-- INDUSTRIVERN ORGANIZATION
-- =============================================

CREATE TABLE public.industrivern_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  org_number TEXT NOT NULL,
  naeringskode TEXT NOT NULL,
  address TEXT,
  is_reinforced BOOLEAN DEFAULT false,
  reinforcement_types TEXT[],
  avg_employees_per_year INTEGER NOT NULL DEFAULT 0,
  nso_registered BOOLEAN DEFAULT false,
  nso_registration_date DATE,
  nso_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDUSTRIVERN PERSONNEL
-- =============================================

CREATE TABLE public.industrivern_personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role industrivern_role NOT NULL,
  is_deputy BOOLEAN DEFAULT false,
  deputy_for UUID REFERENCES public.industrivern_personnel(id),
  emergency_phone TEXT,
  health_cert_date DATE,
  health_cert_expires DATE,
  health_cert_approved BOOLEAN,
  is_active BOOLEAN DEFAULT true,
  appointed_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, role)
);

-- =============================================
-- EMERGENCY PLANS
-- =============================================

CREATE TABLE public.emergency_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  version_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  organization_chart JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ALERT PLANS
-- =============================================

CREATE TABLE public.alert_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_plan_id UUID REFERENCES public.emergency_plans(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  alert_sequence JSONB NOT NULL,
  notify_neighbors BOOLEAN DEFAULT false,
  neighbor_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ACTION CARDS
-- =============================================

CREATE TABLE public.action_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_plan_id UUID REFERENCES public.emergency_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  target_role industrivern_role,
  immediate_actions TEXT[] NOT NULL,
  extended_actions TEXT[],
  equipment_needed TEXT[],
  safety_considerations TEXT[],
  qr_code_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- EMERGENCY RESOURCES
-- =============================================

CREATE TABLE public.emergency_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_plan_id UUID REFERENCES public.emergency_plans(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('internal', 'external', 'equipment')),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  contact_info JSONB,
  response_time_minutes INTEGER,
  availability TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDUSTRIVERN EQUIPMENT
-- =============================================

CREATE TABLE public.industrivern_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category iv_equipment_category NOT NULL,
  equipment_type TEXT NOT NULL,
  name TEXT NOT NULL,
  serial_number TEXT,
  inventory_number TEXT,
  location TEXT NOT NULL,
  location_details TEXT,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  qr_code_url TEXT,
  last_inspection_date DATE,
  next_inspection_date DATE,
  inspection_interval_months INTEGER DEFAULT 12,
  last_service_date DATE,
  next_service_date DATE,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'needs_inspection', 'needs_service', 'defective', 'retired')),
  assigned_to UUID REFERENCES public.profiles(id),
  manual_url TEXT,
  certificate_url TEXT,
  photos JSONB,
  purchase_date DATE,
  warranty_expires DATE,
  supplier TEXT,
  cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- EQUIPMENT INSPECTIONS
-- =============================================

CREATE TABLE public.iv_equipment_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.industrivern_equipment(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('visual', 'functional', 'service')),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspected_by UUID NOT NULL REFERENCES public.profiles(id),
  passed BOOLEAN NOT NULL,
  findings TEXT,
  actions_taken TEXT,
  photos JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDUSTRIVERN QUALIFICATIONS
-- =============================================

CREATE TABLE public.industrivern_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  required_for_roles industrivern_role[],
  validity_months INTEGER,
  training_hours INTEGER,
  training_provider TEXT,
  external_certification BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- PERSONNEL QUALIFICATIONS
-- =============================================

CREATE TABLE public.personnel_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  qualification_id UUID NOT NULL REFERENCES public.industrivern_qualifications(id),
  achieved_date DATE NOT NULL,
  expires_date DATE,
  certificate_number TEXT,
  certificate_url TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_date DATE,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired', 'revoked')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, qualification_id)
);

-- =============================================
-- INDUSTRIVERN EXERCISES
-- =============================================

CREATE TABLE public.industrivern_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  exercise_type exercise_type NOT NULL,
  planned_date DATE NOT NULL,
  planned_start TIME,
  planned_end TIME,
  location TEXT,
  incident_scenario TEXT,
  risk_assessment_id UUID,
  learning_objectives TEXT[],
  target_roles industrivern_role[],
  external_participants TEXT[],
  actual_date DATE,
  actual_start TIME,
  actual_end TIME,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled', 'postponed')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- EXERCISE PARTICIPANTS
-- =============================================

CREATE TABLE public.exercise_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.industrivern_exercises(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  industrivern_role industrivern_role,
  attended BOOLEAN DEFAULT false,
  attendance_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exercise_id, profile_id)
);

-- =============================================
-- EXERCISE EVALUATIONS
-- =============================================

CREATE TABLE public.exercise_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.industrivern_exercises(id) ON DELETE CASCADE,
  objectives_met BOOLEAN,
  strengths TEXT[],
  weaknesses TEXT[],
  observations TEXT,
  improvement_actions JSONB,
  evaluated_by UUID REFERENCES public.profiles(id),
  evaluation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDUSTRIVERN COORDINATION
-- =============================================

CREATE TABLE public.industrivern_coordination (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  partner_org_number TEXT,
  partner_address TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  agreement_date DATE,
  agreement_document_url TEXT,
  coordination_areas TEXT[],
  mutual_risks TEXT[],
  shared_radio_channel TEXT,
  emergency_contact_protocol TEXT,
  is_active BOOLEAN DEFAULT true,
  last_review_date DATE,
  next_review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDUSTRIVERN INCIDENTS
-- =============================================

CREATE TABLE public.industrivern_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_date TIMESTAMPTZ NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'serious', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  injured_count INTEGER DEFAULT 0,
  fatalities INTEGER DEFAULT 0,
  external_impact BOOLEAN DEFAULT false,
  industrivern_activated BOOLEAN DEFAULT true,
  response_time_minutes INTEGER,
  nødetater_called BOOLEAN DEFAULT false,
  actions_taken TEXT[],
  lessons_learned TEXT,
  follow_up_actions JSONB,
  reported_to_nso BOOLEAN DEFAULT false,
  nso_report_date DATE,
  photos JSONB,
  documents JSONB,
  reported_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- EXERCISE SCHEDULE
-- =============================================

CREATE TABLE public.exercise_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  is_reinforced BOOLEAN DEFAULT false,
  h1_exercises_planned INTEGER DEFAULT 1,
  h1_exercises_completed INTEGER DEFAULT 0,
  h2_exercises_planned INTEGER DEFAULT 1,
  h2_exercises_completed INTEGER DEFAULT 0,
  q1_exercises_planned INTEGER DEFAULT 0,
  q1_exercises_completed INTEGER DEFAULT 0,
  q2_exercises_planned INTEGER DEFAULT 0,
  q2_exercises_completed INTEGER DEFAULT 0,
  q3_exercises_planned INTEGER DEFAULT 0,
  q3_exercises_completed INTEGER DEFAULT 0,
  q4_exercises_planned INTEGER DEFAULT 0,
  q4_exercises_completed INTEGER DEFAULT 0,
  compliance_status TEXT DEFAULT 'on_track' CHECK (compliance_status IN ('on_track', 'behind', 'compliant', 'non_compliant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(year)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_industrivern_personnel_profile ON public.industrivern_personnel(profile_id);
CREATE INDEX idx_industrivern_personnel_role ON public.industrivern_personnel(role);
CREATE INDEX idx_industrivern_equipment_category ON public.industrivern_equipment(category);
CREATE INDEX idx_industrivern_equipment_status ON public.industrivern_equipment(status);
CREATE INDEX idx_industrivern_equipment_next_inspection ON public.industrivern_equipment(next_inspection_date);
CREATE INDEX idx_personnel_qualifications_profile ON public.personnel_qualifications(profile_id);
CREATE INDEX idx_personnel_qualifications_expires ON public.personnel_qualifications(expires_date);
CREATE INDEX idx_industrivern_exercises_date ON public.industrivern_exercises(planned_date);
CREATE INDEX idx_industrivern_exercises_status ON public.industrivern_exercises(status);
CREATE INDEX idx_industrivern_incidents_date ON public.industrivern_incidents(incident_date);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.industrivern_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industrivern_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industrivern_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iv_equipment_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industrivern_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industrivern_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industrivern_coordination ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industrivern_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_schedule ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Admin full access
-- =============================================

-- industrivern_organization
CREATE POLICY "Admins can manage industrivern organization" ON public.industrivern_organization
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view organization" ON public.industrivern_organization
  FOR SELECT USING (auth.role() = 'authenticated');

-- industrivern_personnel
CREATE POLICY "Admins can manage industrivern personnel" ON public.industrivern_personnel
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view personnel" ON public.industrivern_personnel
  FOR SELECT USING (auth.role() = 'authenticated');

-- emergency_plans
CREATE POLICY "Admins can manage emergency plans" ON public.emergency_plans
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view active plans" ON public.emergency_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- alert_plans
CREATE POLICY "Admins can manage alert plans" ON public.alert_plans
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view alert plans" ON public.alert_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- action_cards
CREATE POLICY "Admins can manage action cards" ON public.action_cards
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view action cards" ON public.action_cards
  FOR SELECT USING (auth.role() = 'authenticated');

-- emergency_resources
CREATE POLICY "Admins can manage emergency resources" ON public.emergency_resources
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view resources" ON public.emergency_resources
  FOR SELECT USING (auth.role() = 'authenticated');

-- industrivern_equipment
CREATE POLICY "Admins can manage industrivern equipment" ON public.industrivern_equipment
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view equipment" ON public.industrivern_equipment
  FOR SELECT USING (auth.role() = 'authenticated');

-- iv_equipment_inspections
CREATE POLICY "Admins can manage equipment inspections" ON public.iv_equipment_inspections
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view inspections" ON public.iv_equipment_inspections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create inspections" ON public.iv_equipment_inspections
  FOR INSERT WITH CHECK (auth.uid() = inspected_by);

-- industrivern_qualifications
CREATE POLICY "Admins can manage qualifications" ON public.industrivern_qualifications
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view qualifications" ON public.industrivern_qualifications
  FOR SELECT USING (auth.role() = 'authenticated');

-- personnel_qualifications
CREATE POLICY "Admins can manage personnel qualifications" ON public.personnel_qualifications
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can view own qualifications" ON public.personnel_qualifications
  FOR SELECT USING (auth.uid() = profile_id OR auth.role() = 'authenticated');

-- industrivern_exercises
CREATE POLICY "Admins can manage exercises" ON public.industrivern_exercises
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view exercises" ON public.industrivern_exercises
  FOR SELECT USING (auth.role() = 'authenticated');

-- exercise_participants
CREATE POLICY "Admins can manage exercise participants" ON public.exercise_participants
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view participants" ON public.exercise_participants
  FOR SELECT USING (auth.role() = 'authenticated');

-- exercise_evaluations
CREATE POLICY "Admins can manage evaluations" ON public.exercise_evaluations
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view evaluations" ON public.exercise_evaluations
  FOR SELECT USING (auth.role() = 'authenticated');

-- industrivern_coordination
CREATE POLICY "Admins can manage coordination" ON public.industrivern_coordination
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view coordination" ON public.industrivern_coordination
  FOR SELECT USING (auth.role() = 'authenticated');

-- industrivern_incidents
CREATE POLICY "Admins can manage incidents" ON public.industrivern_incidents
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view incidents" ON public.industrivern_incidents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can report incidents" ON public.industrivern_incidents
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- exercise_schedule
CREATE POLICY "Admins can manage exercise schedule" ON public.exercise_schedule
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view schedule" ON public.exercise_schedule
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_industrivern_organization_updated_at
  BEFORE UPDATE ON public.industrivern_organization
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_industrivern_personnel_updated_at
  BEFORE UPDATE ON public.industrivern_personnel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_plans_updated_at
  BEFORE UPDATE ON public.emergency_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_plans_updated_at
  BEFORE UPDATE ON public.alert_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_cards_updated_at
  BEFORE UPDATE ON public.action_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_resources_updated_at
  BEFORE UPDATE ON public.emergency_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_industrivern_equipment_updated_at
  BEFORE UPDATE ON public.industrivern_equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_industrivern_qualifications_updated_at
  BEFORE UPDATE ON public.industrivern_qualifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personnel_qualifications_updated_at
  BEFORE UPDATE ON public.personnel_qualifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_industrivern_exercises_updated_at
  BEFORE UPDATE ON public.industrivern_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercise_evaluations_updated_at
  BEFORE UPDATE ON public.exercise_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_industrivern_coordination_updated_at
  BEFORE UPDATE ON public.industrivern_coordination
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_industrivern_incidents_updated_at
  BEFORE UPDATE ON public.industrivern_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercise_schedule_updated_at
  BEFORE UPDATE ON public.exercise_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DEFAULT QUALIFICATIONS
-- =============================================

INSERT INTO public.industrivern_qualifications (name, code, description, required_for_roles, validity_months, training_hours, external_certification) VALUES
  ('Industrivern grunnkurs', 'IV_GRUNNKURS', 'Grunnleggende opplæring i industrivern', ARRAY['innsatsperson', 'fagleder_industrivern', 'industrivernleder']::industrivern_role[], NULL, 8, false),
  ('Industrivernleder-kurs', 'IV_LEDER', 'Lederopplæring for industrivernledere', ARRAY['industrivernleder']::industrivern_role[], NULL, 16, false),
  ('Fagleder industrivern', 'IV_FAGLEDER', 'Faglederkurs for industrivern', ARRAY['fagleder_industrivern']::industrivern_role[], NULL, 16, false),
  ('Førstehjelp utvidet', 'FH_UTVIDET', 'Utvidet førstehjelpsopplæring', ARRAY['forstehjelp']::industrivern_role[], 24, 16, false),
  ('Brannvernkurs', 'BRANNVERN', 'Grunnleggende brannvern og slukkeopplæring', ARRAY['brannvern', 'innsatsperson']::industrivern_role[], NULL, 8, false),
  ('Røykdykkerkurs', 'ROYKDYKKER', 'Røykdykkeropplæring ihht DSB krav', ARRAY['roykdykker']::industrivern_role[], 12, 40, true),
  ('Kjemikaliedykkerkurs', 'KJEMDYKKER', 'Kjemikaliedykkeropplæring ihht DSB krav', ARRAY['kjemikaliedykker']::industrivern_role[], 12, 40, true),
  ('Miljø- og kjemikalievern', 'MILJO_KJEM', 'Opplæring i håndtering av kjemikalieuhell', ARRAY['miljo_kjemikalievern']::industrivern_role[], 24, 16, false),
  ('Orden og sikring', 'ORDEN', 'Opplæring i avsperring, mottak og sikring', ARRAY['orden_sikring']::industrivern_role[], NULL, 8, false),
  ('Redningsstab', 'REDNINGSSTAB', 'Opplæring i strategisk ledelse av redningsarbeid', ARRAY['redningsstab']::industrivern_role[], NULL, 16, false);
