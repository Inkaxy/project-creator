-- =====================================================
-- LØNNSBEREGNINGSMODUL - DATABASE MIGRASJON
-- =====================================================

-- 1. Opprett holidays tabell for norske helligdager
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  holiday_type TEXT NOT NULL CHECK (holiday_type IN ('public', 'bank', 'observance')),
  supplement_percentage NUMERIC(5,2) DEFAULT 100,
  restricted_opening BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date)
);

-- 2. Opprett payroll_calculations tabell for lønnsperioder
CREATE TABLE IF NOT EXISTS public.payroll_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'exported', 'paid')),
  total_hours NUMERIC(10,2) DEFAULT 0,
  total_base_pay NUMERIC(12,2) DEFAULT 0,
  total_supplements NUMERIC(12,2) DEFAULT 0,
  total_overtime NUMERIC(12,2) DEFAULT 0,
  total_gross NUMERIC(12,2) DEFAULT 0,
  exported_at TIMESTAMPTZ,
  exported_by UUID REFERENCES profiles(id),
  export_reference TEXT,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Opprett payroll_entries tabell for detaljert lønnsberegning per ansatt
CREATE TABLE IF NOT EXISTS public.payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id UUID REFERENCES payroll_calculations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Arbeidstimer
  regular_hours NUMERIC(8,2) DEFAULT 0,
  overtime_50_hours NUMERIC(8,2) DEFAULT 0,
  overtime_100_hours NUMERIC(8,2) DEFAULT 0,
  
  -- Tilleggstimer
  evening_hours NUMERIC(8,2) DEFAULT 0,
  night_hours NUMERIC(8,2) DEFAULT 0,
  saturday_hours NUMERIC(8,2) DEFAULT 0,
  sunday_hours NUMERIC(8,2) DEFAULT 0,
  holiday_hours NUMERIC(8,2) DEFAULT 0,
  
  -- Lønn
  hourly_rate NUMERIC(10,2),
  base_pay NUMERIC(12,2) DEFAULT 0,
  overtime_pay NUMERIC(12,2) DEFAULT 0,
  supplement_pay NUMERIC(12,2) DEFAULT 0,
  gross_pay NUMERIC(12,2) DEFAULT 0,
  
  -- Fravær
  sick_leave_hours NUMERIC(8,2) DEFAULT 0,
  sick_leave_pay NUMERIC(12,2) DEFAULT 0,
  vacation_hours NUMERIC(8,2) DEFAULT 0,
  vacation_pay NUMERIC(12,2) DEFAULT 0,
  
  -- Detaljer (JSON for daglig breakdown)
  line_items JSONB DEFAULT '[]',
  notes TEXT,
  adjustments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Legg til tripletex-mapping i wage_supplements hvis ikke finnes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wage_supplements' 
    AND column_name = 'tripletex_code'
  ) THEN
    ALTER TABLE public.wage_supplements ADD COLUMN tripletex_code TEXT;
  END IF;
END $$;

-- 5. Legg til time_start og time_end kolonner hvis ikke finnes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wage_supplements' 
    AND column_name = 'time_start'
  ) THEN
    ALTER TABLE public.wage_supplements ADD COLUMN time_start TIME;
    ALTER TABLE public.wage_supplements ADD COLUMN time_end TIME;
  END IF;
END $$;

-- 6. Opprett indekser
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_calculations(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll_calculations(status);
CREATE INDEX IF NOT EXISTS idx_payroll_entry_employee ON payroll_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entry_payroll ON payroll_entries(payroll_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- 7. Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for holidays (read by all authenticated, write by admin/manager)
CREATE POLICY "All authenticated users can view holidays"
ON public.holidays FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage holidays"
ON public.holidays FOR ALL
USING (is_admin_or_manager(auth.uid()));

-- 9. RLS Policies for payroll_calculations (admin/manager only)
CREATE POLICY "Admins and managers can view payroll calculations"
ON public.payroll_calculations FOR SELECT
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins and managers can manage payroll calculations"
ON public.payroll_calculations FOR ALL
USING (is_admin_or_manager(auth.uid()));

-- 10. RLS Policies for payroll_entries
CREATE POLICY "Admins and managers can view all payroll entries"
ON public.payroll_entries FOR SELECT
USING (is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view own payroll entries"
ON public.payroll_entries FOR SELECT
USING (auth.uid() = employee_id);

CREATE POLICY "Admins and managers can manage payroll entries"
ON public.payroll_entries FOR ALL
USING (is_admin_or_manager(auth.uid()));

-- 11. Trigger for updated_at on payroll_calculations
CREATE TRIGGER update_payroll_calculations_updated_at
BEFORE UPDATE ON public.payroll_calculations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 12. Seed norske helligdager for 2025 og 2026
INSERT INTO public.holidays (date, name, holiday_type, supplement_percentage) VALUES
  -- 2025 - Faste helligdager
  ('2025-01-01', 'Første nyttårsdag', 'public', 100),
  ('2025-05-01', 'Arbeidernes dag', 'public', 100),
  ('2025-05-17', 'Grunnlovsdagen', 'public', 100),
  ('2025-12-25', 'Første juledag', 'public', 100),
  ('2025-12-26', 'Andre juledag', 'public', 100),
  -- 2025 - Bevegelige helligdager (påske 20. april 2025)
  ('2025-04-17', 'Skjærtorsdag', 'public', 100),
  ('2025-04-18', 'Langfredag', 'public', 100),
  ('2025-04-20', 'Første påskedag', 'public', 100),
  ('2025-04-21', 'Andre påskedag', 'public', 100),
  ('2025-05-29', 'Kristi himmelfartsdag', 'public', 100),
  ('2025-06-08', 'Første pinsedag', 'public', 100),
  ('2025-06-09', 'Andre pinsedag', 'public', 100),
  -- 2026 - Faste helligdager
  ('2026-01-01', 'Første nyttårsdag', 'public', 100),
  ('2026-05-01', 'Arbeidernes dag', 'public', 100),
  ('2026-05-17', 'Grunnlovsdagen', 'public', 100),
  ('2026-12-25', 'Første juledag', 'public', 100),
  ('2026-12-26', 'Andre juledag', 'public', 100),
  -- 2026 - Bevegelige helligdager (påske 5. april 2026)
  ('2026-04-02', 'Skjærtorsdag', 'public', 100),
  ('2026-04-03', 'Langfredag', 'public', 100),
  ('2026-04-05', 'Første påskedag', 'public', 100),
  ('2026-04-06', 'Andre påskedag', 'public', 100),
  ('2026-05-14', 'Kristi himmelfartsdag', 'public', 100),
  ('2026-05-24', 'Første pinsedag', 'public', 100),
  ('2026-05-25', 'Andre pinsedag', 'public', 100)
ON CONFLICT (date) DO NOTHING;

-- 13. Oppdater wage_supplements med standardtider og tripletex-koder
UPDATE public.wage_supplements SET 
  time_start = '17:00',
  time_end = '21:00',
  tripletex_code = '5010'
WHERE applies_to = 'evening' AND time_start IS NULL;

UPDATE public.wage_supplements SET 
  time_start = '21:00',
  time_end = '06:00',
  tripletex_code = '5020'
WHERE applies_to = 'night' AND time_start IS NULL;

UPDATE public.wage_supplements SET 
  tripletex_code = '5030'
WHERE applies_to = 'weekend' AND tripletex_code IS NULL;

UPDATE public.wage_supplements SET 
  tripletex_code = '5050'
WHERE applies_to = 'holiday' AND tripletex_code IS NULL;