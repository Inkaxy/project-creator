-- Create timesheet_settings table for auto-approval configuration
CREATE TABLE public.timesheet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_approve_within_margin BOOLEAN DEFAULT true,
  margin_minutes INTEGER DEFAULT 15,
  default_positive_deviation_handling TEXT DEFAULT 'time_bank',
  default_negative_deviation_handling TEXT DEFAULT 'ignore',
  require_explanation_above_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.timesheet_settings ENABLE ROW LEVEL SECURITY;

-- Only admins/managers can view and update settings (using correct role names)
CREATE POLICY "Managers can view timesheet settings"
  ON public.timesheet_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
    )
  );

CREATE POLICY "Admins can update timesheet settings"
  ON public.timesheet_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'daglig_leder')
    )
  );

CREATE POLICY "Admins can insert timesheet settings"
  ON public.timesheet_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'daglig_leder')
    )
  );

-- Insert default settings
INSERT INTO public.timesheet_settings (auto_approve_within_margin, margin_minutes)
VALUES (true, 15);

-- Create time_entry_deviations table to track how deviations are handled
CREATE TABLE public.time_entry_deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  deviation_type TEXT NOT NULL CHECK (deviation_type IN ('early_start', 'late_start', 'early_end', 'late_end', 'extended_break', 'short_break')),
  deviation_minutes INTEGER NOT NULL,
  handling TEXT CHECK (handling IN ('time_bank', 'overtime_50', 'overtime_100', 'comp_time', 'ignore', 'deduct')),
  handled_by UUID REFERENCES auth.users(id),
  handled_at TIMESTAMPTZ,
  notes TEXT,
  account_transaction_id UUID REFERENCES public.account_transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.time_entry_deviations ENABLE ROW LEVEL SECURITY;

-- Employees can view their own deviations
CREATE POLICY "Employees can view own deviations"
  ON public.time_entry_deviations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.time_entries te
      WHERE te.id = time_entry_id
      AND te.employee_id = auth.uid()
    )
  );

-- Managers can view all deviations
CREATE POLICY "Managers can view all deviations"
  ON public.time_entry_deviations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
    )
  );

-- Managers can insert deviations
CREATE POLICY "Managers can insert deviations"
  ON public.time_entry_deviations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
    )
  );

-- Managers can update deviations
CREATE POLICY "Managers can update deviations"
  ON public.time_entry_deviations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'daglig_leder', 'avdelingsleder')
    )
  );

-- Add trigger for updated_at on timesheet_settings
CREATE TRIGGER update_timesheet_settings_updated_at
  BEFORE UPDATE ON public.timesheet_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();