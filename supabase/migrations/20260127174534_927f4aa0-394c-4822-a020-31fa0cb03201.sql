-- =============================================
-- CrewTalk: Medarbeidersamtaler Module
-- =============================================

-- 1. Conversation Categories
CREATE TABLE public.conversation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read categories"
  ON public.conversation_categories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.conversation_categories FOR ALL
  TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- 2. Conversation Questions
CREATE TABLE public.conversation_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.conversation_categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  description TEXT,
  question_type TEXT NOT NULL DEFAULT 'open' CHECK (question_type IN ('open', 'rating', 'yes_no')),
  is_default BOOLEAN DEFAULT false,
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read questions"
  ON public.conversation_questions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage questions"
  ON public.conversation_questions FOR ALL
  TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- 3. Conversation Templates
CREATE TABLE public.conversation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'standard',
  estimated_duration_minutes INTEGER DEFAULT 60,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read templates"
  ON public.conversation_templates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage templates"
  ON public.conversation_templates FOR ALL
  TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- 4. Conversation Template Questions (junction table)
CREATE TABLE public.conversation_template_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.conversation_templates(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.conversation_questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT false,
  UNIQUE(template_id, question_id)
);

ALTER TABLE public.conversation_template_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read template questions"
  ON public.conversation_template_questions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage template questions"
  ON public.conversation_template_questions FOR ALL
  TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- 5. Conversations (main table)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id),
  manager_id UUID NOT NULL REFERENCES public.profiles(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  location_type TEXT DEFAULT 'in_person' CHECK (location_type IN ('in_person', 'video', 'phone')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  template_id UUID REFERENCES public.conversation_templates(id),
  manager_notes TEXT,
  employee_notes TEXT,
  summary TEXT,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  notification_settings JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
  allow_employee_preparation BOOLEAN DEFAULT true,
  reminder_sent_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own conversations"
  ON public.conversations FOR SELECT
  TO authenticated USING (auth.uid() = employee_id OR auth.uid() = manager_id OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers create conversations"
  ON public.conversations FOR INSERT
  TO authenticated WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Participants update conversations"
  ON public.conversations FOR UPDATE
  TO authenticated USING (auth.uid() = employee_id OR auth.uid() = manager_id OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers delete conversations"
  ON public.conversations FOR DELETE
  TO authenticated USING (auth.uid() = manager_id OR public.is_admin_or_manager(auth.uid()));

-- 6. Conversation Responses
CREATE TABLE public.conversation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.conversation_questions(id),
  response_text TEXT,
  response_rating INTEGER CHECK (response_rating BETWEEN 1 AND 5),
  manager_notes TEXT,
  is_skipped BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, question_id)
);

ALTER TABLE public.conversation_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants see responses"
  ON public.conversation_responses FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (c.employee_id = auth.uid() OR c.manager_id = auth.uid() OR public.is_admin_or_manager(auth.uid()))
    )
  );

CREATE POLICY "Managers manage responses"
  ON public.conversation_responses FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (c.manager_id = auth.uid() OR public.is_admin_or_manager(auth.uid()))
    )
  );

-- 7. Conversation Actions
CREATE TABLE public.conversation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible_id UUID NOT NULL REFERENCES public.profiles(id),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants see actions"
  ON public.conversation_actions FOR SELECT
  TO authenticated USING (
    responsible_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (c.employee_id = auth.uid() OR c.manager_id = auth.uid() OR public.is_admin_or_manager(auth.uid()))
    )
  );

CREATE POLICY "Managers manage actions"
  ON public.conversation_actions FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (c.manager_id = auth.uid() OR public.is_admin_or_manager(auth.uid()))
    )
  );

CREATE POLICY "Responsible can update own actions"
  ON public.conversation_actions FOR UPDATE
  TO authenticated USING (responsible_id = auth.uid());

-- 8. Conversation Notifications
CREATE TABLE public.conversation_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('invitation', 'reminder', 'confirmation', 'cancelled', 'action_reminder')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON public.conversation_notifications FOR SELECT
  TO authenticated USING (recipient_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers manage notifications"
  ON public.conversation_notifications FOR ALL
  TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Trigger for updated_at on conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA: Categories and Questions
-- =============================================

-- Insert Categories
INSERT INTO public.conversation_categories (name, description, icon, color, sort_order) VALUES
  ('Trivsel & Arbeidsmiljø', 'Spørsmål om trivsel og arbeidsmiljø', '😊', '#22C55E', 1),
  ('Arbeidsoppgaver & Utvikling', 'Spørsmål om arbeidsoppgaver og personlig utvikling', '📈', '#3B82F6', 2),
  ('Samarbeid & Kommunikasjon', 'Spørsmål om samarbeid og kommunikasjon i teamet', '🤝', '#8B5CF6', 3),
  ('Karriere & Fremtid', 'Spørsmål om karriereplaner og fremtidige mål', '🎯', '#F59E0B', 4),
  ('Ledelse & Støtte', 'Spørsmål om lederstøtte og veiledning', '👔', '#EC4899', 5),
  ('Balanse & Helse', 'Spørsmål om work-life balance og helse', '⚖️', '#14B8A6', 6),
  ('Onboarding', 'Spørsmål for nye ansatte', '🚀', '#6366F1', 7);

-- Insert Questions for each category
-- Trivsel & Arbeidsmiljø
INSERT INTO public.conversation_questions (category_id, question_text, question_type, is_default, sort_order)
SELECT c.id, q.question_text, q.question_type, q.is_default, q.sort_order
FROM public.conversation_categories c
CROSS JOIN (VALUES
  ('Hvordan trives du på jobb for tiden?', 'open', true, 1),
  ('På en skala fra 1-5, hvor motivert føler du deg i jobben din?', 'rating', true, 2),
  ('Føler du at du blir sett og verdsatt for arbeidet du gjør?', 'open', true, 3),
  ('Er det noe som påvirker trivselen din negativt som vi bør snakke om?', 'open', false, 4),
  ('Hva er det beste med å jobbe her?', 'open', false, 5)
) AS q(question_text, question_type, is_default, sort_order)
WHERE c.name = 'Trivsel & Arbeidsmiljø';

-- Arbeidsoppgaver & Utvikling
INSERT INTO public.conversation_questions (category_id, question_text, question_type, is_default, sort_order)
SELECT c.id, q.question_text, q.question_type, q.is_default, q.sort_order
FROM public.conversation_categories c
CROSS JOIN (VALUES
  ('Hvordan synes du arbeidsoppgavene dine er for tiden - for mye, passelig, eller for lite?', 'open', true, 1),
  ('Er det oppgaver du ønsker mer av eller mindre av?', 'open', true, 2),
  ('Føler du at du har de ressursene og verktøyene du trenger?', 'open', false, 3),
  ('Hvilke ferdigheter ønsker du å utvikle videre?', 'open', true, 4),
  ('Er det kurs eller opplæring du mener ville vært nyttig for deg?', 'open', false, 5)
) AS q(question_text, question_type, is_default, sort_order)
WHERE c.name = 'Arbeidsoppgaver & Utvikling';

-- Samarbeid & Kommunikasjon
INSERT INTO public.conversation_questions (category_id, question_text, question_type, is_default, sort_order)
SELECT c.id, q.question_text, q.question_type, q.is_default, q.sort_order
FROM public.conversation_categories c
CROSS JOIN (VALUES
  ('Hvordan opplever du samarbeidet med kollegene dine?', 'open', true, 1),
  ('Føler du at kommunikasjonen i teamet fungerer godt?', 'open', false, 2),
  ('Er det noen samarbeidsutfordringer vi bør adressere?', 'open', false, 3)
) AS q(question_text, question_type, is_default, sort_order)
WHERE c.name = 'Samarbeid & Kommunikasjon';

-- Karriere & Fremtid
INSERT INTO public.conversation_questions (category_id, question_text, question_type, is_default, sort_order)
SELECT c.id, q.question_text, q.question_type, q.is_default, q.sort_order
FROM public.conversation_categories c
CROSS JOIN (VALUES
  ('Hvor ser du deg selv om 1-2 år?', 'open', true, 1),
  ('Er det andre roller eller ansvarsområder i bedriften som interesserer deg?', 'open', false, 2),
  ('Hva må til for at du fortsatt skal jobbe her om 3 år?', 'open', false, 3)
) AS q(question_text, question_type, is_default, sort_order)
WHERE c.name = 'Karriere & Fremtid';

-- Ledelse & Støtte
INSERT INTO public.conversation_questions (category_id, question_text, question_type, is_default, sort_order)
SELECT c.id, q.question_text, q.question_type, q.is_default, q.sort_order
FROM public.conversation_categories c
CROSS JOIN (VALUES
  ('Får du nok støtte og veiledning fra meg som leder?', 'open', true, 1),
  ('Hva kan jeg gjøre annerledes for å støtte deg bedre?', 'open', false, 2),
  ('Føler du at du får ærlige og konstruktive tilbakemeldinger?', 'open', false, 3)
) AS q(question_text, question_type, is_default, sort_order)
WHERE c.name = 'Ledelse & Støtte';

-- Balanse & Helse
INSERT INTO public.conversation_questions (category_id, question_text, question_type, is_default, sort_order)
SELECT c.id, q.question_text, q.question_type, q.is_default, q.sort_order
FROM public.conversation_categories c
CROSS JOIN (VALUES
  ('Hvordan opplever du balansen mellom jobb og fritid?', 'open', true, 1),
  ('Er det noe med arbeidstider eller fleksibilitet vi bør diskutere?', 'open', false, 2),
  ('Føler du at arbeidsbelastningen er bærekraftig over tid?', 'open', false, 3)
) AS q(question_text, question_type, is_default, sort_order)
WHERE c.name = 'Balanse & Helse';

-- Onboarding
INSERT INTO public.conversation_questions (category_id, question_text, question_type, is_default, sort_order)
SELECT c.id, q.question_text, q.question_type, q.is_default, q.sort_order
FROM public.conversation_categories c
CROSS JOIN (VALUES
  ('Hvordan har oppstarten vært så langt?', 'open', true, 1),
  ('Har du fått den opplæringen du trenger?', 'open', true, 2),
  ('Er det noe du savner informasjon om?', 'open', false, 3),
  ('Føler du deg velkommen i teamet?', 'open', true, 4)
) AS q(question_text, question_type, is_default, sort_order)
WHERE c.name = 'Onboarding';

-- Create default template
INSERT INTO public.conversation_templates (name, description, template_type, estimated_duration_minutes, is_default) VALUES
  ('Standard medarbeidersamtale', 'Standardmal med de viktigste spørsmålene fra hver kategori', 'standard', 60, true),
  ('Onboarding-samtale', 'Samtale for nye ansatte i prøveperioden', 'onboarding', 45, false),
  ('Korte oppfølgingssamtale', 'Rask oppfølging med fokus på trivsel', 'followup', 30, false);