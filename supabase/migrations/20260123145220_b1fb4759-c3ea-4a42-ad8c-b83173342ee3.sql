-- Create contract_templates table for employment contract templates
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  employee_type TEXT,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create employee_onboardings table for tracking onboarding process
CREATE TABLE public.employee_onboardings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employee_type TEXT,
  department_id UUID REFERENCES public.departments(id),
  function_id UUID REFERENCES public.functions(id),
  start_date DATE,
  
  -- Status tracking
  status TEXT DEFAULT 'invited' CHECK (status IN (
    'invited',
    'info_pending',
    'account_pending',
    'contract_pending',
    'signature_pending',
    'completed',
    'cancelled'
  )),
  
  -- Step completion timestamps
  invitation_sent_at TIMESTAMPTZ,
  info_completed_at TIMESTAMPTZ,
  account_created_at TIMESTAMPTZ,
  contract_generated_at TIMESTAMPTZ,
  contract_signed_at TIMESTAMPTZ,
  
  -- Links and tokens
  invitation_token TEXT UNIQUE,
  profile_id UUID REFERENCES public.profiles(id),
  contract_document_id UUID REFERENCES public.employee_documents(id),
  contract_template_id UUID REFERENCES public.contract_templates(id),
  
  -- Personal info collected during onboarding
  personal_number TEXT,
  bank_account_number TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  date_of_birth DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  -- Meta
  created_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboardings ENABLE ROW LEVEL SECURITY;

-- RLS policies for contract_templates
CREATE POLICY "Admins can manage contract templates"
ON public.contract_templates FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Anyone can view active contract templates"
ON public.contract_templates FOR SELECT
USING (is_active = true);

-- RLS policies for employee_onboardings
CREATE POLICY "Admins can manage onboardings"
ON public.employee_onboardings FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can view their own onboarding"
ON public.employee_onboardings FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own onboarding info"
ON public.employee_onboardings FOR UPDATE
USING (profile_id = auth.uid() OR invitation_token IS NOT NULL)
WITH CHECK (profile_id = auth.uid() OR invitation_token IS NOT NULL);

-- Public access policy for onboarding by token (for unauthenticated users)
CREATE POLICY "Anyone can view onboarding by token"
ON public.employee_onboardings FOR SELECT
USING (invitation_token IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_onboardings_status ON public.employee_onboardings(status);
CREATE INDEX idx_onboardings_token ON public.employee_onboardings(invitation_token);
CREATE INDEX idx_onboardings_email ON public.employee_onboardings(email);
CREATE INDEX idx_contract_templates_active ON public.contract_templates(is_active);

-- Updated at triggers
CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboardings_updated_at
BEFORE UPDATE ON public.employee_onboardings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for contracts
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-contracts', 'employee-contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can manage contracts"
ON storage.objects FOR ALL
USING (bucket_id = 'employee-contracts' AND public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can view own contracts"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert default contract template
INSERT INTO public.contract_templates (name, employee_type, content, is_default) VALUES
('Standard arbeidsavtale - Fast ansatt', 'fast', 
'# ARBEIDSAVTALE

## Parter
**Arbeidsgiver:** {{company_name}}
**Arbeidstaker:** {{full_name}}
**Fødselsdato:** {{date_of_birth}}

## Stilling
**Stillingstittel:** {{function}}
**Avdeling:** {{department}}
**Ansettelsestype:** {{employee_type}}
**Tiltredelsesdato:** {{start_date}}

## Arbeidssted
Arbeidet utføres ved bedriftens lokaler eller der arbeidsgiver til enhver tid bestemmer.

## Arbeidstid
Normal arbeidstid er i henhold til gjeldende lover og avtaler.

## Lønn
Lønn avtales særskilt og utbetales den siste virkedagen hver måned.

## Ferie
Arbeidstaker har rett til ferie i henhold til ferieloven.

## Oppsigelse
Oppsigelsestiden er 1 måned fra den 1. i måneden etter at oppsigelse er mottatt.

## Taushetsplikt
Arbeidstaker har taushetsplikt om bedriftens forretningshemmeligheter.

---

**Dato:** {{today}}

**Arbeidsgiver:** ________________________

**Arbeidstaker:** ________________________', true),
('Standard arbeidsavtale - Deltid', 'deltid',
'# ARBEIDSAVTALE - DELTIDSSTILLING

## Parter
**Arbeidsgiver:** {{company_name}}
**Arbeidstaker:** {{full_name}}
**Fødselsdato:** {{date_of_birth}}

## Stilling
**Stillingstittel:** {{function}}
**Avdeling:** {{department}}
**Ansettelsestype:** Deltidsansatt
**Tiltredelsesdato:** {{start_date}}

## Arbeidstid
Stillingsprosent og arbeidstid avtales nærmere.

## Lønn
Timelønn/månedslønn avtales særskilt.

---

**Dato:** {{today}}

**Arbeidsgiver:** ________________________

**Arbeidstaker:** ________________________', false),
('Standard arbeidsavtale - Tilkalling', 'tilkalling',
'# ARBEIDSAVTALE - TILKALLINGSHJELP

## Parter
**Arbeidsgiver:** {{company_name}}
**Arbeidstaker:** {{full_name}}

## Stilling
**Stillingstittel:** {{function}}
**Ansettelsestype:** Tilkallingshjelp
**Startdato:** {{start_date}}

## Arbeid
Arbeidstaker tilkalles ved behov. Det foreligger ingen garanti for arbeid.

---

**Dato:** {{today}}

**Signaturer:** ________________________', false);