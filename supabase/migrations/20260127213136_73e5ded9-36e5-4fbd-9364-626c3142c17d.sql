-- =============================================
-- LØNNSEKSPORT SYSTEM - KOMPLETT MIGRASJON
-- =============================================

-- 1. employee_external_ids - Kobler ansatte til eksterne systemer
CREATE TABLE public.employee_external_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  system_type TEXT NOT NULL CHECK (system_type IN (
    'tripletex', 'poweroffice', '24sevenoffice', 'visma', 'xledger', 'fiken', 'custom'
  )),
  external_id TEXT NOT NULL,
  external_name TEXT,
  is_active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'error', 'manual')),
  sync_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(employee_id, system_type)
);

-- 2. salary_types - Lønnsarter med beregningsregler
CREATE TABLE public.salary_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'hourly', 'monthly', 'supplement', 'overtime', 'absence', 'bonus', 'deduction', 'other'
  )),
  calculation_type TEXT NOT NULL CHECK (calculation_type IN (
    'hours', 'days', 'fixed', 'percentage', 'manual'
  )),
  default_rate DECIMAL(10,2),
  percentage_base TEXT,
  is_taxable BOOLEAN DEFAULT true,
  is_pension_basis BOOLEAN DEFAULT true,
  is_vacation_basis BOOLEAN DEFAULT true,
  a_melding_code TEXT,
  auto_calculate BOOLEAN DEFAULT false,
  time_range_start TIME,
  time_range_end TIME,
  applies_to_days INTEGER[],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. salary_type_mappings - Ekstern system-mapping for lønnsarter
CREATE TABLE public.salary_type_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_type_id UUID NOT NULL REFERENCES salary_types(id) ON DELETE CASCADE,
  system_type TEXT NOT NULL CHECK (system_type IN (
    'tripletex', 'poweroffice', '24sevenoffice', 'visma', 'xledger', 'fiken', 'custom'
  )),
  external_code TEXT NOT NULL,
  external_name TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(salary_type_id, system_type)
);

-- 4. payroll_integrations - Integrasjonskonfigurasjon
CREATE TABLE public.payroll_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_type TEXT NOT NULL UNIQUE CHECK (system_type IN (
    'tripletex', 'poweroffice', '24sevenoffice', 'visma', 'xledger', 'fiken'
  )),
  is_enabled BOOLEAN DEFAULT false,
  is_configured BOOLEAN DEFAULT false,
  api_endpoint TEXT,
  settings JSONB DEFAULT '{
    "auto_export": false,
    "export_approved_only": true,
    "include_supplements": true,
    "include_overtime": true,
    "default_salary_type": null,
    "department_mapping": {},
    "project_mapping": {}
  }',
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. payroll_exports - Lønnseksport-logger
CREATE TABLE public.payroll_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_system TEXT NOT NULL CHECK (target_system IN (
    'tripletex', 'poweroffice', '24sevenoffice', 'visma', 'xledger', 'fiken', 'file_export'
  )),
  export_type TEXT NOT NULL CHECK (export_type IN ('api', 'file')),
  file_format TEXT CHECK (file_format IN ('csv', 'xlsx', 'json', 'xml')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'partial', 'failed', 'cancelled'
  )),
  employee_count INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  export_file_url TEXT,
  api_response JSONB,
  error_message TEXT,
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  exported_by UUID REFERENCES profiles(id),
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. payroll_export_lines - Detaljerte eksportlinjer
CREATE TABLE public.payroll_export_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES payroll_exports(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id),
  external_employee_id TEXT,
  salary_type_id UUID REFERENCES salary_types(id),
  external_salary_code TEXT NOT NULL,
  salary_type_name TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2),
  amount DECIMAL(12,2) NOT NULL,
  work_date DATE,
  period_start DATE,
  period_end DATE,
  source_type TEXT CHECK (source_type IN ('time_entry', 'shift', 'manual', 'calculated')),
  source_id UUID,
  department_code TEXT,
  project_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'exported', 'error', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEKSER
-- =============================================

CREATE INDEX idx_employee_external_ids_employee ON employee_external_ids(employee_id);
CREATE INDEX idx_employee_external_ids_system ON employee_external_ids(system_type);
CREATE INDEX idx_employee_external_ids_external ON employee_external_ids(external_id, system_type);

CREATE INDEX idx_salary_types_code ON salary_types(code);
CREATE INDEX idx_salary_types_category ON salary_types(category);
CREATE INDEX idx_salary_types_active ON salary_types(is_active) WHERE is_active = true;

CREATE INDEX idx_salary_type_mappings_system ON salary_type_mappings(system_type);
CREATE INDEX idx_salary_type_mappings_salary_type ON salary_type_mappings(salary_type_id);

CREATE INDEX idx_payroll_exports_period ON payroll_exports(period_start, period_end);
CREATE INDEX idx_payroll_exports_status ON payroll_exports(status);
CREATE INDEX idx_payroll_exports_target ON payroll_exports(target_system);

CREATE INDEX idx_payroll_export_lines_export ON payroll_export_lines(export_id);
CREATE INDEX idx_payroll_export_lines_employee ON payroll_export_lines(employee_id);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE employee_external_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_type_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_export_lines ENABLE ROW LEVEL SECURITY;

-- employee_external_ids
CREATE POLICY "Admins can manage external_ids" 
ON employee_external_ids FOR ALL 
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view own external_ids" 
ON employee_external_ids FOR SELECT 
USING (employee_id = auth.uid());

-- salary_types (alle kan lese, kun admin kan endre)
CREATE POLICY "Anyone can view salary_types" 
ON salary_types FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage salary_types" 
ON salary_types FOR ALL 
USING (is_admin_or_manager(auth.uid()));

-- salary_type_mappings
CREATE POLICY "Anyone can view salary_type_mappings" 
ON salary_type_mappings FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage salary_type_mappings" 
ON salary_type_mappings FOR ALL 
USING (is_admin_or_manager(auth.uid()));

-- payroll_integrations
CREATE POLICY "Admins can manage integrations" 
ON payroll_integrations FOR ALL 
USING (is_admin_or_manager(auth.uid()));

-- payroll_exports
CREATE POLICY "Admins can manage exports" 
ON payroll_exports FOR ALL 
USING (is_admin_or_manager(auth.uid()));

-- payroll_export_lines
CREATE POLICY "Admins can manage export_lines" 
ON payroll_export_lines FOR ALL 
USING (is_admin_or_manager(auth.uid()));

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_employee_external_ids_updated_at
  BEFORE UPDATE ON employee_external_ids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_types_updated_at
  BEFORE UPDATE ON salary_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_type_mappings_updated_at
  BEFORE UPDATE ON salary_type_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_integrations_updated_at
  BEFORE UPDATE ON payroll_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_exports_updated_at
  BEFORE UPDATE ON payroll_exports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DATA - Standard lønnsarter
-- =============================================

INSERT INTO salary_types (code, name, description, category, calculation_type, is_taxable, is_pension_basis, is_vacation_basis, auto_calculate, time_range_start, time_range_end, applies_to_days, sort_order) VALUES
-- Grunnlønn
('1000', 'Timelønn', 'Ordinære arbeidstimer', 'hourly', 'hours', true, true, true, true, NULL, NULL, NULL, 10),
('1020', 'Timer variabel', 'Timer utover fast stilling', 'hourly', 'hours', true, true, true, true, NULL, NULL, NULL, 11),
('1100', 'Fastlønn', 'Fast månedslønn', 'monthly', 'fixed', true, true, true, false, NULL, NULL, NULL, 20),

-- Tillegg med tidsregler
('2010', 'Kveldstillegg', 'Tillegg for arbeid kl 17:00-21:00', 'supplement', 'hours', true, true, true, true, '17:00:00', '21:00:00', NULL, 30),
('2020', 'Nattillegg', 'Tillegg for arbeid kl 21:00-06:00', 'supplement', 'hours', true, true, true, true, '21:00:00', '06:00:00', NULL, 31),
('2030', 'Helgetillegg lørdag', 'Tillegg for arbeid på lørdager', 'supplement', 'hours', true, true, true, true, NULL, NULL, ARRAY[6], 32),
('2040', 'Helgetillegg søndag', 'Tillegg for arbeid på søndager', 'supplement', 'hours', true, true, true, true, NULL, NULL, ARRAY[0], 33),
('2050', 'Helligdagstillegg', 'Tillegg for arbeid på helligdager', 'supplement', 'hours', true, true, true, true, NULL, NULL, NULL, 34),

-- Overtid
('3010', 'Overtid 50%', 'Overtid første 2 timer daglig', 'overtime', 'hours', true, false, true, true, NULL, NULL, NULL, 40),
('3020', 'Overtid 100%', 'Overtid etter 2 timer / natt/helg', 'overtime', 'hours', true, false, true, true, NULL, NULL, NULL, 41),

-- Fravær
('4010', 'Sykepenger arbeidsgiver', 'Sykepenger dag 1-16', 'absence', 'days', true, true, true, false, NULL, NULL, NULL, 50),
('4020', 'Egenmelding', 'Egenmelding', 'absence', 'days', true, true, true, false, NULL, NULL, NULL, 51),
('4030', 'Feriepenger', 'Utbetaling av feriepenger', 'absence', 'fixed', true, false, false, false, NULL, NULL, NULL, 52),

-- Bonus/Andre
('5010', 'Bonus', 'Bonus/gratiale', 'bonus', 'manual', true, false, true, false, NULL, NULL, NULL, 60),
('5020', 'Provisjon', 'Provisjonslønn', 'bonus', 'manual', true, true, true, false, NULL, NULL, NULL, 61);

-- Tripletex-mapping
INSERT INTO salary_type_mappings (salary_type_id, system_type, external_code, external_name)
SELECT id, 'tripletex', code, name FROM salary_types;

-- PowerOffice-mapping (ofte andre koder)
INSERT INTO salary_type_mappings (salary_type_id, system_type, external_code, external_name)
SELECT id, 'poweroffice', 
  CASE code 
    WHEN '1000' THEN '100'
    WHEN '1020' THEN '101'
    WHEN '2010' THEN '200'
    WHEN '2020' THEN '201'
    WHEN '2030' THEN '202'
    WHEN '2040' THEN '203'
    WHEN '2050' THEN '204'
    WHEN '3010' THEN '300'
    WHEN '3020' THEN '301'
    ELSE code 
  END,
  name 
FROM salary_types;

-- Opprett standard integrasjonsoppføringer
INSERT INTO payroll_integrations (system_type, is_enabled, is_configured) VALUES
('tripletex', false, false),
('poweroffice', false, false);