-- =====================================================
-- INTERNKONTROLL SYSTEM - DATABASE MIGRATION
-- =====================================================

-- 1. TEMPERATUR-ENHETER (kjøleskap, frysere, etc.)
CREATE TABLE public.temperature_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  min_temp DECIMAL NOT NULL DEFAULT 0,
  max_temp DECIMAL NOT NULL DEFAULT 8,
  sensor_id TEXT,
  is_iot BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TEMPERATUR-LOGGER
CREATE TABLE public.temperature_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.temperature_units(id) ON DELETE CASCADE,
  temperature DECIMAL NOT NULL,
  logged_by UUID REFERENCES public.profiles(id),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deviation BOOLEAN DEFAULT false,
  deviation_action TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. AVVIK (Deviations)
CREATE TABLE public.deviations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'concern',
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  is_anonymous BOOLEAN DEFAULT false,
  image_url TEXT,
  reported_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  closed_by UUID REFERENCES public.profiles(id),
  closed_at TIMESTAMPTZ,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. AVVIK-KOMMENTARER
CREATE TABLE public.deviation_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deviation_id UUID NOT NULL REFERENCES public.deviations(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. VERNERUNDER
CREATE TABLE public.safety_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id),
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'planned',
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. VERNERUNDE-PUNKTER
CREATE TABLE public.safety_round_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.safety_rounds(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT,
  finding TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ROS-ANALYSE (Risk Analysis)
CREATE TABLE public.risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  probability INT NOT NULL DEFAULT 1 CHECK (probability >= 1 AND probability <= 5),
  consequence INT NOT NULL DEFAULT 1 CHECK (consequence >= 1 AND consequence <= 5),
  risk_score INT GENERATED ALWAYS AS (probability * consequence) STORED,
  current_measures TEXT,
  planned_measures TEXT,
  responsible UUID REFERENCES public.profiles(id),
  review_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. BRANNØVELSER
CREATE TABLE public.fire_drills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  drill_type TEXT NOT NULL DEFAULT 'evacuation',
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INT,
  participants_count INT,
  meeting_point TEXT,
  evacuation_time_seconds INT,
  responsible UUID REFERENCES public.profiles(id),
  notes TEXT,
  evaluation TEXT,
  improvement_points TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. BRANNVERNUTSTYR
CREATE TABLE public.fire_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  location TEXT NOT NULL,
  serial_number TEXT,
  qr_code TEXT,
  last_inspected_at DATE,
  next_inspection_date DATE,
  last_service_at DATE,
  next_service_date DATE,
  status TEXT NOT NULL DEFAULT 'ok',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. UTSTYRSKONTROLLER
CREATE TABLE public.equipment_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.fire_equipment(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL DEFAULT 'visual',
  inspected_by UUID REFERENCES public.profiles(id),
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ok',
  notes TEXT,
  image_url TEXT
);

-- 11. KURS
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INT,
  is_required BOOLEAN DEFAULT false,
  required_for_roles TEXT[],
  required_for_functions UUID[],
  certificate_valid_months INT,
  external_url TEXT,
  is_external BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. KURSMODULER
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  content JSONB,
  duration_minutes INT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. KURSPÅMELDINGER
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score INT,
  current_module_id UUID REFERENCES public.course_modules(id),
  progress_percent INT DEFAULT 0,
  certificate_url TEXT,
  certificate_expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, employee_id)
);

-- 14. TILSYN (Inspections from authorities)
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_type TEXT NOT NULL,
  authority TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  inspector_name TEXT,
  outcome TEXT,
  notes TEXT,
  report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.temperature_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deviation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_round_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fire_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fire_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Temperature Units (all can read, admin can write)
-- =====================================================

CREATE POLICY "Anyone authenticated can view temperature units"
ON public.temperature_units FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage temperature units"
ON public.temperature_units FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Temperature Logs
-- =====================================================

CREATE POLICY "Anyone authenticated can view temperature logs"
ON public.temperature_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone authenticated can insert temperature logs"
ON public.temperature_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = logged_by OR logged_by IS NULL);

CREATE POLICY "Admins can manage temperature logs"
ON public.temperature_logs FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Deviations
-- =====================================================

CREATE POLICY "Anyone authenticated can view deviations"
ON public.deviations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone authenticated can report deviations"
ON public.deviations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reported_by OR reported_by IS NULL);

CREATE POLICY "Admins can manage deviations"
ON public.deviations FOR UPDATE
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can delete deviations"
ON public.deviations FOR DELETE
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Deviation Comments
-- =====================================================

CREATE POLICY "Anyone authenticated can view deviation comments"
ON public.deviation_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone authenticated can add comments"
ON public.deviation_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- =====================================================
-- RLS POLICIES - Safety Rounds
-- =====================================================

CREATE POLICY "Anyone authenticated can view safety rounds"
ON public.safety_rounds FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage safety rounds"
ON public.safety_rounds FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Safety Round Items
-- =====================================================

CREATE POLICY "Anyone authenticated can view safety round items"
ON public.safety_round_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone authenticated can update safety round items"
ON public.safety_round_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can manage safety round items"
ON public.safety_round_items FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Risk Assessments
-- =====================================================

CREATE POLICY "Anyone authenticated can view risk assessments"
ON public.risk_assessments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage risk assessments"
ON public.risk_assessments FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Fire Drills
-- =====================================================

CREATE POLICY "Anyone authenticated can view fire drills"
ON public.fire_drills FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage fire drills"
ON public.fire_drills FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Fire Equipment
-- =====================================================

CREATE POLICY "Anyone authenticated can view fire equipment"
ON public.fire_equipment FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage fire equipment"
ON public.fire_equipment FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Equipment Inspections
-- =====================================================

CREATE POLICY "Anyone authenticated can view equipment inspections"
ON public.equipment_inspections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone authenticated can add equipment inspections"
ON public.equipment_inspections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = inspected_by);

-- =====================================================
-- RLS POLICIES - Courses
-- =====================================================

CREATE POLICY "Anyone authenticated can view courses"
ON public.courses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage courses"
ON public.courses FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Course Modules
-- =====================================================

CREATE POLICY "Anyone authenticated can view course modules"
ON public.course_modules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage course modules"
ON public.course_modules FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Course Enrollments
-- =====================================================

CREATE POLICY "Users can view their own enrollments"
ON public.course_enrollments FOR SELECT
TO authenticated
USING (auth.uid() = employee_id OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can enroll themselves"
ON public.course_enrollments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update their own enrollments"
ON public.course_enrollments FOR UPDATE
TO authenticated
USING (auth.uid() = employee_id OR public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES - Inspections
-- =====================================================

CREATE POLICY "Anyone authenticated can view inspections"
ON public.inspections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage inspections"
ON public.inspections FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE TRIGGER update_temperature_units_updated_at
BEFORE UPDATE ON public.temperature_units
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deviations_updated_at
BEFORE UPDATE ON public.deviations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safety_rounds_updated_at
BEFORE UPDATE ON public.safety_rounds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at
BEFORE UPDATE ON public.risk_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fire_drills_updated_at
BEFORE UPDATE ON public.fire_drills
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fire_equipment_updated_at
BEFORE UPDATE ON public.fire_equipment
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at
BEFORE UPDATE ON public.course_enrollments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
BEFORE UPDATE ON public.inspections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED DATA - Sample temperature units
-- =====================================================

INSERT INTO public.temperature_units (name, location, min_temp, max_temp) VALUES
  ('Kjøleskap 1', 'Kjøkken', 0, 4),
  ('Kjøleskap 2', 'Kjøkken', 0, 4),
  ('Fryser 1', 'Lager', -25, -18),
  ('Fryser 2', 'Lager', -25, -18),
  ('Kjøledisk', 'Butikk', 0, 4),
  ('Varmeskap', 'Kjøkken', 60, 80);

-- =====================================================
-- SEED DATA - Sample courses
-- =====================================================

INSERT INTO public.courses (title, description, category, duration_minutes, is_required, certificate_valid_months) VALUES
  ('HMS for ledere', 'Obligatorisk HMS-opplæring for alle ledere', 'hms', 240, true, NULL),
  ('Grunnleggende HMS', 'Introduksjon til HMS for alle ansatte', 'hms', 60, true, NULL),
  ('Brannvern grunnkurs', 'Grunnleggende brannvernopplæring', 'brann', 120, true, 24),
  ('Førstehjelp', 'Førstehjelpskurs med praktiske øvelser', 'hms', 180, false, 24),
  ('Allergen-håndtering', 'Opplæring i håndtering av allergener', 'ik_mat', 45, true, NULL),
  ('Hygiene og smittevern', 'Grunnleggende hygiene for matservering', 'ik_mat', 60, true, NULL),
  ('Verneombudskurs', 'Fullstendig verneombudskurs (40 timer)', 'hms', 2400, false, NULL);

-- =====================================================
-- SEED DATA - Sample fire equipment
-- =====================================================

INSERT INTO public.fire_equipment (name, equipment_type, location, status, next_inspection_date) VALUES
  ('Brannslukker A1', 'extinguisher', 'Inngang', 'ok', CURRENT_DATE + INTERVAL '30 days'),
  ('Brannslukker A2', 'extinguisher', 'Kjøkken', 'ok', CURRENT_DATE + INTERVAL '30 days'),
  ('Brannslukker A3', 'extinguisher', 'Lager', 'ok', CURRENT_DATE + INTERVAL '30 days'),
  ('Røykvarsler 1', 'smoke_detector', 'Spisesal', 'ok', CURRENT_DATE + INTERVAL '365 days'),
  ('Røykvarsler 2', 'smoke_detector', 'Kjøkken', 'ok', CURRENT_DATE + INTERVAL '365 days'),
  ('Nødlys 1', 'emergency_light', 'Inngang', 'ok', CURRENT_DATE + INTERVAL '365 days'),
  ('Nødlys 2', 'emergency_light', 'Bakutgang', 'ok', CURRENT_DATE + INTERVAL '365 days'),
  ('Brannteppe', 'fire_blanket', 'Kjøkken', 'ok', CURRENT_DATE + INTERVAL '365 days');