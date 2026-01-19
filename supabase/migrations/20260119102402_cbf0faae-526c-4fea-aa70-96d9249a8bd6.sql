-- IK-MAT INTERNKONTROLL-MAPPE TABLES
-- Based on Norwegian IK-Mat requirements (Internkontrollforskriften § 5)

-- 1. DOCUMENT FOLDERS (9 main categories per IK-Mat requirements)
CREATE TABLE public.ik_document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.ik_document_folders(id) ON DELETE CASCADE,
  code TEXT NOT NULL,                -- '01', '02', '02.1', etc.
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',        -- Lucide icon name
  sort_order INT DEFAULT 0,
  is_system BOOLEAN DEFAULT true,    -- System-defined, cannot be deleted
  is_required BOOLEAN DEFAULT false, -- Lovpålagt skriftlig dokumentasjon
  legal_reference TEXT,              -- e.g., 'IK-Mat § 5 nr. 4'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DOCUMENTS
CREATE TABLE public.ik_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.ik_document_folders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'routine', -- 'routine', 'form_template', 'certificate', 'agreement', 'report', 'external'
  name TEXT NOT NULL,
  description TEXT,
  
  -- Content (for editable documents)
  content TEXT,                     -- Markdown content
  file_url TEXT,                    -- For uploaded files
  file_name TEXT,
  file_size INT,
  file_mime_type TEXT,
  
  -- Versioning
  version_number TEXT DEFAULT '1.0',
  change_description TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',      -- 'draft', 'active', 'review_pending', 'archived'
  
  -- Review cycle
  review_interval_days INT DEFAULT 365,
  next_review_date DATE,
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES public.profiles(id),
  
  -- Approval
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Linking to other modules
  linked_checklist_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  
  -- Metadata
  is_required BOOLEAN DEFAULT false, -- Required for compliance
  legal_reference TEXT,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DOCUMENT VERSION HISTORY
CREATE TABLE public.ik_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.ik_documents(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  change_description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DOCUMENT READ ACKNOWLEDGMENTS
CREATE TABLE public.ik_document_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.ik_documents(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT true,
  UNIQUE(document_id, version_number, employee_id)
);

-- 5. DOCUMENT REVIEWS (for annual/periodic review)
CREATE TABLE public.ik_document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.ik_documents(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ DEFAULT now(),
  outcome TEXT NOT NULL,           -- 'approved', 'needs_update', 'archived'
  notes TEXT,
  next_review_date DATE
);

-- Enable RLS
ALTER TABLE public.ik_document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_document_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_document_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders (everyone can read)
CREATE POLICY "Anyone can view folders" ON public.ik_document_folders
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage folders" ON public.ik_document_folders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('superadmin', 'daglig_leder')
    )
  );

-- RLS Policies for documents
CREATE POLICY "Anyone can view active documents" ON public.ik_documents
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage documents" ON public.ik_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('superadmin', 'daglig_leder')
    )
  );

-- RLS Policies for versions (read only for most)
CREATE POLICY "Anyone can view versions" ON public.ik_document_versions
  FOR SELECT USING (true);

CREATE POLICY "Admins can create versions" ON public.ik_document_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('superadmin', 'daglig_leder')
    )
  );

-- RLS Policies for reads (users can manage their own)
CREATE POLICY "Users can view their reads" ON public.ik_document_reads
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Users can create their reads" ON public.ik_document_reads
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can view all reads" ON public.ik_document_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
    )
  );

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.ik_document_reviews
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage reviews" ON public.ik_document_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('superadmin', 'daglig_leder')
    )
  );

-- Indexes
CREATE INDEX idx_ik_documents_folder ON public.ik_documents(folder_id);
CREATE INDEX idx_ik_documents_status ON public.ik_documents(status);
CREATE INDEX idx_ik_document_versions_document ON public.ik_document_versions(document_id);
CREATE INDEX idx_ik_document_reads_employee ON public.ik_document_reads(employee_id);
CREATE INDEX idx_ik_document_reads_document ON public.ik_document_reads(document_id);

-- INSERT DEFAULT FOLDER STRUCTURE (9 main categories per IK-Mat requirements)
INSERT INTO public.ik_document_folders (code, name, description, icon, sort_order, is_system, is_required, legal_reference) VALUES
('01', 'Virksomhetsbeskrivelse', 'Informasjon om virksomheten, organisasjon og lokaler', 'building-2', 1, true, false, 'IK-Mat § 5 nr. 1'),
('02', 'Grunnforutsetninger', 'Rutiner for mattrygghet (hygiene, renhold, temperatur, etc.)', 'shield-check', 2, true, false, NULL),
('03', 'Fareanalyse / HACCP', 'Fareidentifikasjon og kritiske styringspunkt', 'alert-circle', 3, true, false, NULL),
('04', 'Avvikshåndtering', 'Rutiner ved avvik og forebyggende tiltak', 'alert-triangle', 4, true, true, 'IK-Mat § 5 nr. 4-5'),
('05', 'Opplæring', 'Opplæringsplan og dokumentasjon av kompetanse', 'graduation-cap', 5, true, false, 'IK-Mat § 5 nr. 2'),
('06', 'Logger og registreringer', 'Temperaturlogger, sjekklister og andre registreringer', 'file-text', 6, true, false, 'IK-Mat § 5 nr. 6'),
('07', 'Gjennomgang og revisjon', 'Årlig gjennomgang av internkontrollen', 'calendar-check', 7, true, true, 'IK-Mat § 5 nr. 7'),
('08', 'Dokumentstyring', 'Oversikt og kontroll over dokumenter', 'folder-cog', 8, true, true, 'IK-Mat § 5 nr. 8'),
('09', 'Eksterne dokumenter', 'Serviceavtaler, sertifikater og tilsynsrapporter', 'file-archive', 9, true, false, NULL);

-- Insert subcategories for Grunnforutsetninger (02)
INSERT INTO public.ik_document_folders (parent_id, code, name, description, icon, sort_order, is_system) 
SELECT id, '02.1', 'Personlig hygiene', 'Håndvask, arbeidsantrekk og sykdomsrutiner', 'hand', 1, true
FROM public.ik_document_folders WHERE code = '02';

INSERT INTO public.ik_document_folders (parent_id, code, name, description, icon, sort_order, is_system) 
SELECT id, '02.2', 'Renhold', 'Renholdsplan og rutiner', 'sparkles', 2, true
FROM public.ik_document_folders WHERE code = '02';

INSERT INTO public.ik_document_folders (parent_id, code, name, description, icon, sort_order, is_system) 
SELECT id, '02.3', 'Temperaturkontroll', 'Kjøling, frysing, varmholding og nedkjøling', 'thermometer', 3, true
FROM public.ik_document_folders WHERE code = '02';

INSERT INTO public.ik_document_folders (parent_id, code, name, description, icon, sort_order, is_system) 
SELECT id, '02.4', 'Skadedyrkontroll', 'Forebygging og serviceavtaler', 'bug', 4, true
FROM public.ik_document_folders WHERE code = '02';

INSERT INTO public.ik_document_folders (parent_id, code, name, description, icon, sort_order, is_system) 
SELECT id, '02.5', 'Vedlikehold', 'Rutine for vedlikehold av utstyr og lokaler', 'wrench', 5, true
FROM public.ik_document_folders WHERE code = '02';

INSERT INTO public.ik_document_folders (parent_id, code, name, description, icon, sort_order, is_system) 
SELECT id, '02.6', 'Allergener', 'Allergenhåndtering og oversikt', 'wheat', 6, true
FROM public.ik_document_folders WHERE code = '02';

INSERT INTO public.ik_document_folders (parent_id, code, name, description, icon, sort_order, is_system) 
SELECT id, '02.7', 'Sporbarhet', 'Varemottak og tilbaketrekking', 'package-search', 7, true
FROM public.ik_document_folders WHERE code = '02';