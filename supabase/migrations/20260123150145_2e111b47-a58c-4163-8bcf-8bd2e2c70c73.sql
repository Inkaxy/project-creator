-- Utvid contract_templates med lønnsseksjoner
ALTER TABLE public.contract_templates 
ADD COLUMN IF NOT EXISTS salary_section_hourly TEXT,
ADD COLUMN IF NOT EXISTS salary_section_fixed TEXT;

-- Opprett generated_contracts tabell
CREATE TABLE public.generated_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.contract_templates(id),
  onboarding_id UUID REFERENCES public.employee_onboardings(id),
  
  -- Kontraktinnhold
  title TEXT NOT NULL DEFAULT 'Arbeidsavtale',
  content TEXT NOT NULL,
  pdf_url TEXT,
  
  -- Versjonering
  version INTEGER DEFAULT 1,
  supersedes_id UUID REFERENCES public.generated_contracts(id),
  
  -- Status og signatur
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'signed', 'expired', 'cancelled')),
  
  -- Ansatt-signatur
  employee_signed_at TIMESTAMPTZ,
  employee_signature_ip TEXT,
  employee_read_confirmed_at TIMESTAMPTZ,
  
  -- Arbeidsgiver-signatur
  employer_signed_at TIMESTAMPTZ,
  employer_signed_by UUID REFERENCES public.profiles(id),
  
  -- Snapshot av flettede verdier
  merged_data JSONB DEFAULT '{}',
  
  -- Metadata
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_contracts ENABLE ROW LEVEL SECURITY;

-- Policies for generated_contracts
CREATE POLICY "Admins can manage all contracts"
ON public.generated_contracts
FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view their own contracts"
ON public.generated_contracts
FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Employees can update their own contracts for signing"
ON public.generated_contracts
FOR UPDATE
USING (employee_id = auth.uid())
WITH CHECK (employee_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_generated_contracts_updated_at
BEFORE UPDATE ON public.generated_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_generated_contracts_employee_id ON public.generated_contracts(employee_id);
CREATE INDEX idx_generated_contracts_status ON public.generated_contracts(status);
CREATE INDEX idx_generated_contracts_onboarding_id ON public.generated_contracts(onboarding_id);

-- Add comment
COMMENT ON TABLE public.generated_contracts IS 'Genererte arbeidskontrakter med signatur-sporing';