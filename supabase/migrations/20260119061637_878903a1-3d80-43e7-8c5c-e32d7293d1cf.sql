-- Add department_id and require_confirmation fields to deviations table
ALTER TABLE public.deviations 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS require_clock_out_confirmation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS confirmation_notes TEXT,
ADD COLUMN IF NOT EXISTS confirmation_image_url TEXT;

-- Create index for faster department queries
CREATE INDEX IF NOT EXISTS idx_deviations_department_id ON public.deviations(department_id);
CREATE INDEX IF NOT EXISTS idx_deviations_assigned_to ON public.deviations(assigned_to);

-- Add RLS policy for department-based access
CREATE POLICY "Avdelingsledere kan se avvik i sin avdeling"
ON public.deviations
FOR SELECT
USING (
  public.is_admin_or_manager(auth.uid()) OR
  department_id = public.get_user_department_id(auth.uid()) OR
  assigned_to = auth.uid() OR
  reported_by = auth.uid()
);

CREATE POLICY "Ledere kan oppdatere avvik"
ON public.deviations
FOR UPDATE
USING (
  public.is_admin_or_manager(auth.uid()) OR
  assigned_to = auth.uid()
);

CREATE POLICY "Ansatte kan melde avvik"
ON public.deviations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);