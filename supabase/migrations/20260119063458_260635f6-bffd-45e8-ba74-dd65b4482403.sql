-- Personalhåndbok (one per company, but we'll use a simplified version without company_id for now)
CREATE TABLE public.handbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Personalhåndbok',
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id),
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  logo_url TEXT,
  footer_text TEXT
);

-- Kapitler i håndboken
CREATE TABLE public.handbook_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handbook_id UUID REFERENCES handbook(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  requires_acknowledgment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seksjoner/artikler i kapitler
CREATE TABLE public.handbook_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES handbook_chapters(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  content_type TEXT DEFAULT 'markdown',
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  requires_acknowledgment BOOLEAN DEFAULT false,
  is_legal_requirement BOOLEAN DEFAULT false,
  legal_reference TEXT,
  last_reviewed_at DATE,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(chapter_id, slug)
);

-- Versjonshistorikk
CREATE TABLE public.handbook_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handbook_id UUID REFERENCES handbook(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL,
  changes_summary TEXT,
  content_snapshot JSONB,
  published_at TIMESTAMPTZ DEFAULT now(),
  published_by UUID REFERENCES profiles(id),
  changed_sections UUID[] DEFAULT '{}'
);

-- Ansattes bekreftelser/signeringer
CREATE TABLE public.handbook_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id) NOT NULL,
  handbook_id UUID REFERENCES handbook(id) NOT NULL,
  section_id UUID REFERENCES handbook_sections(id),
  version TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  signature_method TEXT DEFAULT 'click',
  signature_data TEXT,
  UNIQUE(employee_id, handbook_id, section_id, version)
);

-- Vedlegg til seksjoner
CREATE TABLE public.handbook_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES handbook_sections(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES profiles(id)
);

-- Maler for vanlige policyer
CREATE TABLE public.handbook_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  is_legal_requirement BOOLEAN DEFAULT false,
  legal_reference TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.handbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for handbook
CREATE POLICY "Published handbooks are viewable by all authenticated users"
ON public.handbook FOR SELECT TO authenticated
USING (status = 'published' OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can manage handbooks"
ON public.handbook FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for chapters
CREATE POLICY "Visible chapters are viewable by all authenticated users"
ON public.handbook_chapters FOR SELECT TO authenticated
USING (is_visible = true OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can manage chapters"
ON public.handbook_chapters FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for sections
CREATE POLICY "Visible sections are viewable by all authenticated users"
ON public.handbook_sections FOR SELECT TO authenticated
USING (is_visible = true OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can manage sections"
ON public.handbook_sections FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for versions
CREATE POLICY "Versions are viewable by all authenticated users"
ON public.handbook_versions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage versions"
ON public.handbook_versions FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for acknowledgments
CREATE POLICY "Users can view their own acknowledgments"
ON public.handbook_acknowledgments FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can create their own acknowledgments"
ON public.handbook_acknowledgments FOR INSERT TO authenticated
WITH CHECK (employee_id = auth.uid());

-- RLS Policies for attachments
CREATE POLICY "Attachments are viewable by all authenticated users"
ON public.handbook_attachments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage attachments"
ON public.handbook_attachments FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- RLS Policies for templates
CREATE POLICY "Templates are viewable by admins"
ON public.handbook_templates FOR SELECT TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can manage templates"
ON public.handbook_templates FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Create indexes
CREATE INDEX idx_handbook_chapters_handbook ON public.handbook_chapters(handbook_id);
CREATE INDEX idx_handbook_sections_chapter ON public.handbook_sections(chapter_id);
CREATE INDEX idx_handbook_acknowledgments_employee ON public.handbook_acknowledgments(employee_id);
CREATE INDEX idx_handbook_acknowledgments_handbook ON public.handbook_acknowledgments(handbook_id);

-- Triggers for updated_at
CREATE TRIGGER update_handbook_updated_at
  BEFORE UPDATE ON public.handbook
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_handbook_chapters_updated_at
  BEFORE UPDATE ON public.handbook_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_handbook_sections_updated_at
  BEFORE UPDATE ON public.handbook_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();