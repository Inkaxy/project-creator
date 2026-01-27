-- ============================================
-- AMU Agenda Templates (må opprettes først pga. foreign key)
-- ============================================
CREATE TABLE public.amu_agenda_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- AMU Agenda Template Items
-- ============================================
CREATE TABLE public.amu_agenda_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.amu_agenda_templates(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  estimated_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- AMU Members
-- ============================================
CREATE TABLE public.amu_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  member_type TEXT NOT NULL DEFAULT 'member',
  appointed_date DATE DEFAULT CURRENT_DATE,
  expires_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- ============================================
-- AMU Meetings
-- ============================================
CREATE TABLE public.amu_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_number INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  template_id UUID REFERENCES public.amu_agenda_templates(id),
  general_notes TEXT,
  pdf_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- AMU Meeting Participants
-- ============================================
CREATE TABLE public.amu_meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.amu_meetings(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_status TEXT NOT NULL DEFAULT 'invited',
  role_in_meeting TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, profile_id)
);

-- ============================================
-- AMU Meeting Agenda Items
-- ============================================
CREATE TABLE public.amu_meeting_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.amu_meetings(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  decision TEXT,
  status TEXT DEFAULT 'pending',
  estimated_minutes INTEGER DEFAULT 10,
  actual_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- AMU Meeting Documents
-- ============================================
CREATE TABLE public.amu_meeting_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.amu_meetings(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES public.amu_meeting_agenda_items(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.amu_agenda_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amu_agenda_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amu_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amu_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amu_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amu_meeting_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amu_meeting_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: Check if user is AMU member
-- ============================================
CREATE OR REPLACE FUNCTION public.is_amu_member(_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.amu_members 
    WHERE profile_id = _user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- RLS Policies
-- ============================================

-- AMU Agenda Templates: All authenticated can read, admin can manage
CREATE POLICY "All authenticated can read agenda templates"
  ON public.amu_agenda_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage agenda templates"
  ON public.amu_agenda_templates FOR ALL TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- AMU Agenda Template Items: All authenticated can read
CREATE POLICY "All authenticated can read template items"
  ON public.amu_agenda_template_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage template items"
  ON public.amu_agenda_template_items FOR ALL TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- AMU Members: All can read, admin can manage
CREATE POLICY "All authenticated can read AMU members"
  ON public.amu_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert AMU members"
  ON public.amu_members FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can update AMU members"
  ON public.amu_members FOR UPDATE TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can delete AMU members"
  ON public.amu_members FOR DELETE TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- AMU Meetings: Only AMU members or admin can see
CREATE POLICY "AMU members can read meetings"
  ON public.amu_meetings FOR SELECT TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU members can create meetings"
  ON public.amu_meetings FOR INSERT TO authenticated
  WITH CHECK (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU members can update meetings"
  ON public.amu_meetings FOR UPDATE TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));

-- AMU Meeting Participants: Same as meetings
CREATE POLICY "AMU access to participants"
  ON public.amu_meeting_participants FOR SELECT TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU insert participants"
  ON public.amu_meeting_participants FOR INSERT TO authenticated
  WITH CHECK (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU update participants"
  ON public.amu_meeting_participants FOR UPDATE TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU delete participants"
  ON public.amu_meeting_participants FOR DELETE TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));

-- AMU Meeting Agenda Items: Same as meetings
CREATE POLICY "AMU access to agenda items"
  ON public.amu_meeting_agenda_items FOR SELECT TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU insert agenda items"
  ON public.amu_meeting_agenda_items FOR INSERT TO authenticated
  WITH CHECK (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU update agenda items"
  ON public.amu_meeting_agenda_items FOR UPDATE TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU delete agenda items"
  ON public.amu_meeting_agenda_items FOR DELETE TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));

-- AMU Meeting Documents: Same as meetings
CREATE POLICY "AMU access to documents"
  ON public.amu_meeting_documents FOR SELECT TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU insert documents"
  ON public.amu_meeting_documents FOR INSERT TO authenticated
  WITH CHECK (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "AMU delete documents"
  ON public.amu_meeting_documents FOR DELETE TO authenticated
  USING (public.is_amu_member(auth.uid()) OR public.is_admin_or_manager(auth.uid()));

-- ============================================
-- Insert default AMU agenda template using DO block
-- ============================================
DO $$
DECLARE
  template_uuid UUID;
BEGIN
  INSERT INTO public.amu_agenda_templates (name, description, is_default, is_active)
  VALUES ('Standard AMU-møte', 'Standard agenda basert på Arbeidstilsynets anbefalinger', true, true)
  RETURNING id INTO template_uuid;
  
  INSERT INTO public.amu_agenda_template_items (template_id, sort_order, title, description, is_required, estimated_minutes)
  VALUES
    (template_uuid, 1, 'Gjennomgang og godkjenning av referat fra forrige AMU-møte', 'Godkjenne referat fra forrige møte', true, 5),
    (template_uuid, 2, 'Gjennomgang og status av sykefravær', 'Gjennomgå sykefraværsstatistikk og trender', true, 15),
    (template_uuid, 3, 'Gjennomgang og status av registrerte avvik/forbedringsforslag HMS', 'Status på HMS-avvik og forbedringsforslag', true, 15),
    (template_uuid, 4, 'Ledelse informerer', 'Informasjon fra daglig leder/ledelsen', false, 10),
    (template_uuid, 5, 'Verneombud informerer', 'Informasjon fra verneombud', false, 10),
    (template_uuid, 6, 'Bedriftshelsetjenesten informerer', 'Informasjon fra BHT', false, 10),
    (template_uuid, 7, 'Gjennomgang av rapporter/undersøkelser HMS', 'Relevante HMS-rapporter og undersøkelser', false, 15),
    (template_uuid, 8, 'Eventuelt', 'Andre saker', false, 10);
END $$;

-- ============================================
-- Update triggers for updated_at
-- ============================================
CREATE TRIGGER update_amu_agenda_templates_updated_at
  BEFORE UPDATE ON public.amu_agenda_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_amu_members_updated_at
  BEFORE UPDATE ON public.amu_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_amu_meetings_updated_at
  BEFORE UPDATE ON public.amu_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_amu_meeting_agenda_items_updated_at
  BEFORE UPDATE ON public.amu_meeting_agenda_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();