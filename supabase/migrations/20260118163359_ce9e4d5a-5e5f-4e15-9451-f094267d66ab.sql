-- Create work_time_rules table for company-specific compliance settings
CREATE TABLE public.work_time_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Standard',
  -- Daily limits
  max_hours_per_day DECIMAL(4,2) NOT NULL DEFAULT 9,
  max_hours_per_day_extended DECIMAL(4,2) NOT NULL DEFAULT 10,
  min_rest_between_shifts DECIMAL(4,2) NOT NULL DEFAULT 11,
  -- Weekly limits
  max_hours_per_week DECIMAL(4,2) NOT NULL DEFAULT 40,
  max_hours_per_week_average DECIMAL(4,2) NOT NULL DEFAULT 48,
  averaging_period_weeks INTEGER NOT NULL DEFAULT 8,
  -- Overtime
  overtime_threshold_daily DECIMAL(4,2) NOT NULL DEFAULT 9,
  overtime_threshold_100_daily DECIMAL(4,2) NOT NULL DEFAULT 10,
  max_overtime_per_week DECIMAL(4,2) NOT NULL DEFAULT 10,
  max_overtime_per_year DECIMAL(6,2) NOT NULL DEFAULT 200,
  -- Breaks
  break_required_after_hours DECIMAL(4,2) NOT NULL DEFAULT 5.5,
  min_break_minutes INTEGER NOT NULL DEFAULT 30,
  break_required_after_hours_long DECIMAL(4,2) NOT NULL DEFAULT 8,
  min_break_minutes_long INTEGER NOT NULL DEFAULT 45,
  -- Sundays
  require_sunday_off BOOLEAN NOT NULL DEFAULT true,
  sunday_off_frequency_weeks INTEGER NOT NULL DEFAULT 3,
  -- Warnings
  warn_at_percent_of_max INTEGER NOT NULL DEFAULT 90,
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_time_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies - all authenticated users can read, only admins can write
CREATE POLICY "All authenticated users can read work time rules"
  ON public.work_time_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage work time rules"
  ON public.work_time_rules
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- Insert default Norwegian labor law rules
INSERT INTO public.work_time_rules (name) VALUES ('Norske arbeidsmiljølov-regler');

-- Add updated_at trigger
CREATE TRIGGER update_work_time_rules_updated_at
  BEFORE UPDATE ON public.work_time_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();