
-- =============================================
-- CREWSHARE MODULE - Personnel Sharing System
-- Based on Norwegian labor law §14-13 (production company lending)
-- =============================================

-- Create enum for pool membership status
CREATE TYPE pool_membership_status AS ENUM ('pending', 'active', 'suspended', 'rejected', 'expired');

-- Create enum for pool shift request status
CREATE TYPE pool_shift_request_status AS ENUM ('pending_employer', 'pending_employee', 'approved', 'rejected', 'cancelled', 'completed');

-- =============================================
-- Partner Organizations (bedrifter du deler personale med)
-- =============================================
CREATE TABLE partner_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_number TEXT, -- Norsk organisasjonsnummer
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  is_staffing_agency BOOLEAN DEFAULT false,
  staffing_agency_approval_id TEXT, -- Godkjenningsnummer fra Arbeidstilsynet
  default_hourly_markup DECIMAL(5,2) DEFAULT 0, -- Påslag på timepris
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Pool Settings per Employee (ansattes tilgjengelighet for utleie)
-- =============================================
CREATE TABLE employee_pool_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_available_for_pooling BOOLEAN DEFAULT false,
  pooling_consent_given_at TIMESTAMPTZ,
  max_pool_percentage DECIMAL(5,2) DEFAULT 50.00, -- Max % av arbeidstid til utleie
  min_notice_hours INT DEFAULT 24, -- Minimum varsel før vakt
  max_travel_distance_km DECIMAL(5,2), -- Maks reiseavstand
  preferred_partner_ids UUID[] DEFAULT '{}', -- Foretrukne partnere
  blocked_partner_ids UUID[] DEFAULT '{}', -- Blokkerte partnere
  external_hourly_rate DECIMAL(10,2), -- Timepris for eksterne oppdrag
  available_weekdays BOOLEAN[] DEFAULT '{true,true,true,true,true,true,true}', -- man-søn
  available_from_time TIME DEFAULT '07:00',
  available_to_time TIME DEFAULT '23:00',
  bio TEXT, -- Kort beskrivelse synlig for partnere
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Pool Memberships (tilgang til å låne fra/ut til partner)
-- =============================================
CREATE TABLE pool_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_organization_id UUID REFERENCES partner_organizations(id) ON DELETE CASCADE NOT NULL,
  status pool_membership_status DEFAULT 'pending',
  -- Approval chain
  employer_approved_at TIMESTAMPTZ,
  employer_approved_by UUID REFERENCES profiles(id),
  employee_consented_at TIMESTAMPTZ,
  partner_approved_at TIMESTAMPTZ,
  -- Validity
  valid_from DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, partner_organization_id)
);

-- =============================================
-- Pool Shifts (vakter tilgjengelig for innleie)
-- =============================================
CREATE TABLE pool_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_organization_id UUID REFERENCES partner_organizations(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INT DEFAULT 0,
  function_id UUID REFERENCES functions(id),
  required_certifications TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2) NOT NULL,
  location_address TEXT,
  location_notes TEXT,
  dress_code TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'offered', 'assigned', 'completed', 'cancelled')),
  max_applicants INT DEFAULT 10,
  application_deadline TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  assigned_employee_id UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  hours_worked DECIMAL(5,2),
  employer_rating INT CHECK (employer_rating >= 1 AND employer_rating <= 5),
  employer_feedback TEXT,
  employee_rating INT CHECK (employee_rating >= 1 AND employee_rating <= 5),
  employee_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Pool Shift Requests (forespørsler om vakt)
-- =============================================
CREATE TABLE pool_shift_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_shift_id UUID REFERENCES pool_shifts(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES profiles(id) NOT NULL,
  status pool_shift_request_status DEFAULT 'pending_employer',
  -- Request details
  employee_note TEXT, -- Melding fra ansatt
  employer_response_note TEXT,
  -- Approval chain
  employer_approved_at TIMESTAMPTZ,
  employer_approved_by UUID REFERENCES profiles(id),
  employee_accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  -- Timestamps
  response_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pool_shift_id, employee_id)
);

-- =============================================
-- Pool Work Log (logg over utført arbeid for compliance)
-- =============================================
CREATE TABLE pool_work_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id) NOT NULL,
  partner_organization_id UUID REFERENCES partner_organizations(id) NOT NULL,
  pool_shift_id UUID REFERENCES pool_shifts(id),
  date DATE NOT NULL,
  hours_worked DECIMAL(5,2) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  invoiced BOOLEAN DEFAULT false,
  invoiced_at TIMESTAMPTZ,
  invoice_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Compliance Tracking (50% rule and 3-year rule)
-- =============================================
CREATE TABLE pool_compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id) NOT NULL,
  snapshot_date DATE NOT NULL,
  -- 50% rule tracking
  total_hours_worked DECIMAL(10,2) DEFAULT 0,
  pool_hours_worked DECIMAL(10,2) DEFAULT 0,
  pool_percentage DECIMAL(5,2) DEFAULT 0,
  -- 3-year rule tracking per partner
  partner_tenure JSONB DEFAULT '{}', -- { partner_id: { first_date, total_months, hours } }
  -- Warnings
  warnings JSONB DEFAULT '{}', -- { "50_percent_warning": true, "3_year_warnings": ["partner_id"] }
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, snapshot_date)
);

-- =============================================
-- Employee Ratings (aggregert vurdering)
-- =============================================
CREATE TABLE employee_pool_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_ratings INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_pool_shifts INT DEFAULT 0,
  no_show_count INT DEFAULT 0,
  late_count INT DEFAULT 0,
  reliability_score DECIMAL(5,2) DEFAULT 100, -- Prosent oppmøte
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_pool_memberships_employee ON pool_memberships(employee_id);
CREATE INDEX idx_pool_memberships_partner ON pool_memberships(partner_organization_id);
CREATE INDEX idx_pool_memberships_status ON pool_memberships(status);
CREATE INDEX idx_pool_shifts_date ON pool_shifts(date);
CREATE INDEX idx_pool_shifts_status ON pool_shifts(status);
CREATE INDEX idx_pool_shifts_partner ON pool_shifts(partner_organization_id);
CREATE INDEX idx_pool_shift_requests_employee ON pool_shift_requests(employee_id);
CREATE INDEX idx_pool_shift_requests_status ON pool_shift_requests(status);
CREATE INDEX idx_pool_work_log_employee ON pool_work_log(employee_id);
CREATE INDEX idx_pool_work_log_date ON pool_work_log(date);
CREATE INDEX idx_employee_pool_settings_available ON employee_pool_settings(is_available_for_pooling);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_pool_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_shift_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_work_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_compliance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_pool_ratings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Partner Organizations - admins can manage, everyone can view
CREATE POLICY "Admins can manage partner organizations"
ON partner_organizations FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can view active partner organizations"
ON partner_organizations FOR SELECT
USING (is_active = true);

-- Employee Pool Settings - employees manage own, admins can view all
CREATE POLICY "Employees can manage own pool settings"
ON employee_pool_settings FOR ALL
USING (employee_id = auth.uid());

CREATE POLICY "Admins can view all pool settings"
ON employee_pool_settings FOR SELECT
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can update pool settings"
ON employee_pool_settings FOR UPDATE
USING (public.is_admin_or_manager(auth.uid()));

-- Pool Memberships - complex access based on role
CREATE POLICY "Employees can view own memberships"
ON pool_memberships FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage memberships"
ON pool_memberships FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can update own consent"
ON pool_memberships FOR UPDATE
USING (employee_id = auth.uid())
WITH CHECK (employee_id = auth.uid());

-- Pool Shifts - employees with active membership can view
CREATE POLICY "Admins can manage pool shifts"
ON pool_shifts FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Pooled employees can view open shifts"
ON pool_shifts FOR SELECT
USING (
  status = 'open' 
  AND EXISTS (
    SELECT 1 FROM pool_memberships pm
    JOIN employee_pool_settings eps ON pm.employee_id = eps.employee_id
    WHERE pm.employee_id = auth.uid()
    AND pm.partner_organization_id = pool_shifts.partner_organization_id
    AND pm.status = 'active'
    AND eps.is_available_for_pooling = true
  )
);

CREATE POLICY "Employees can view own assigned shifts"
ON pool_shifts FOR SELECT
USING (assigned_employee_id = auth.uid());

-- Pool Shift Requests
CREATE POLICY "Employees can manage own requests"
ON pool_shift_requests FOR ALL
USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage all requests"
ON pool_shift_requests FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

-- Pool Work Log
CREATE POLICY "Employees can view own work log"
ON pool_work_log FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage work log"
ON pool_work_log FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

-- Compliance Snapshots
CREATE POLICY "Employees can view own compliance"
ON pool_compliance_snapshots FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage compliance"
ON pool_compliance_snapshots FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

-- Employee Pool Ratings
CREATE POLICY "Employees can view own ratings"
ON employee_pool_ratings FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admins can manage ratings"
ON employee_pool_ratings FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Pooled employees can view others ratings"
ON employee_pool_ratings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employee_pool_settings
    WHERE employee_id = auth.uid()
    AND is_available_for_pooling = true
  )
);

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE TRIGGER update_partner_organizations_updated_at
  BEFORE UPDATE ON partner_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_pool_settings_updated_at
  BEFORE UPDATE ON employee_pool_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pool_memberships_updated_at
  BEFORE UPDATE ON pool_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pool_shifts_updated_at
  BEFORE UPDATE ON pool_shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pool_shift_requests_updated_at
  BEFORE UPDATE ON pool_shift_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Helper Functions
-- =============================================

-- Calculate pool percentage for an employee
CREATE OR REPLACE FUNCTION calculate_pool_percentage(
  _employee_id UUID,
  _from_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  _to_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_hours DECIMAL(10,2);
  pool_hours DECIMAL(10,2);
BEGIN
  -- Get total hours worked (from shifts)
  SELECT COALESCE(SUM(
    EXTRACT(EPOCH FROM (
      COALESCE(actual_end::time, planned_end::time) - 
      COALESCE(actual_start::time, planned_start::time)
    )) / 3600 - COALESCE(actual_break_minutes, planned_break_minutes, 0) / 60.0
  ), 0)
  INTO total_hours
  FROM shifts
  WHERE employee_id = _employee_id
  AND date BETWEEN _from_date AND _to_date
  AND status = 'published';
  
  -- Get pool hours
  SELECT COALESCE(SUM(hours_worked), 0)
  INTO pool_hours
  FROM pool_work_log
  WHERE employee_id = _employee_id
  AND date BETWEEN _from_date AND _to_date;
  
  IF total_hours + pool_hours = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((pool_hours / (total_hours + pool_hours)) * 100, 2);
END;
$$;

-- Check if employee can be pooled (not exceeding 50%)
CREATE OR REPLACE FUNCTION can_employee_be_pooled(_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_percentage DECIMAL(5,2);
  max_percentage DECIMAL(5,2);
BEGIN
  SELECT calculate_pool_percentage(_employee_id) INTO current_percentage;
  
  SELECT COALESCE(max_pool_percentage, 50.00)
  INTO max_percentage
  FROM employee_pool_settings
  WHERE employee_id = _employee_id;
  
  RETURN current_percentage < COALESCE(max_percentage, 50.00);
END;
$$;
