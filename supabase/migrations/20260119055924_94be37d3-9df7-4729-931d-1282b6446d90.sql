-- Tilsynsrapporter (genererte rapporter)
CREATE TABLE public.inspection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('mattilsynet', 'arbeidstilsynet', 'branntilsyn', 'skjenkekontroll')),
  generated_by UUID REFERENCES public.profiles(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'submitted')),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tilsynshistorikk (faktiske tilsyn som er gjennomført)
CREATE TABLE public.inspection_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('mattilsynet', 'arbeidstilsynet', 'branntilsyn', 'skjenkekontroll')),
  visit_date DATE NOT NULL,
  inspector_name TEXT,
  result TEXT CHECK (result IN ('approved', 'remarks', 'failed')),
  remarks TEXT,
  findings JSONB DEFAULT '[]',
  deadline DATE,
  report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sertifikater/Kursbevis (for skjenkekontroll og andre)
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.profiles(id) NOT NULL,
  certificate_type TEXT NOT NULL,
  issued_date DATE,
  expiry_date DATE,
  issuer TEXT,
  document_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Legg til inspection_category på eksisterende tabeller
ALTER TABLE public.deviations ADD COLUMN IF NOT EXISTS inspection_category TEXT;
ALTER TABLE public.checklist_templates ADD COLUMN IF NOT EXISTS inspection_categories TEXT[] DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspection_reports
CREATE POLICY "Admins can manage inspection reports"
ON public.inspection_reports FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can view inspection reports"
ON public.inspection_reports FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for inspection_visits
CREATE POLICY "Admins can manage inspection visits"
ON public.inspection_visits FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can view inspection visits"
ON public.inspection_visits FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for certificates
CREATE POLICY "Admins can manage certificates"
ON public.certificates FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can view all certificates"
ON public.certificates FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own certificates"
ON public.certificates FOR ALL
USING (employee_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_inspection_visits_updated_at
  BEFORE UPDATE ON public.inspection_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();