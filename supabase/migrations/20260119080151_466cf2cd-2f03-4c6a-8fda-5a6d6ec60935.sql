-- Add tariff tracking columns to wage_ladders
ALTER TABLE wage_ladders 
ADD COLUMN IF NOT EXISTS tariff_year INTEGER,
ADD COLUMN IF NOT EXISTS tariff_version TEXT;

-- Create seniority_log table for tracking hour additions
CREATE TABLE IF NOT EXISTS public.seniority_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hours_added NUMERIC(10,2) NOT NULL,
  total_hours_after NUMERIC(10,2),
  source TEXT NOT NULL CHECK (source IN ('time_entry', 'manual', 'import', 'adjustment')),
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS on seniority_log
ALTER TABLE public.seniority_log ENABLE ROW LEVEL SECURITY;

-- Policies for seniority_log
CREATE POLICY "Admins can view all seniority logs"
ON public.seniority_log
FOR SELECT
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view own seniority logs"
ON public.seniority_log
FOR SELECT
USING (auth.uid() = employee_id);

CREATE POLICY "Admins can insert seniority logs"
ON public.seniority_log
FOR INSERT
WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can update seniority logs"
ON public.seniority_log
FOR UPDATE
USING (public.is_admin_or_manager(auth.uid()));

-- Create function to update accumulated hours and log the change
CREATE OR REPLACE FUNCTION public.add_seniority_hours(
  p_employee_id UUID,
  p_hours NUMERIC,
  p_source TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_hours NUMERIC;
  v_new_hours NUMERIC;
BEGIN
  -- Get current accumulated hours
  SELECT COALESCE(accumulated_hours, 0) INTO v_current_hours
  FROM employee_details
  WHERE employee_id = p_employee_id;
  
  -- Calculate new total
  v_new_hours := v_current_hours + p_hours;
  
  -- Update employee_details
  UPDATE employee_details
  SET accumulated_hours = v_new_hours,
      updated_at = now()
  WHERE employee_id = p_employee_id;
  
  -- Log the change
  INSERT INTO seniority_log (employee_id, hours_added, total_hours_after, source, reference_id, notes, created_by)
  VALUES (p_employee_id, p_hours, v_new_hours, p_source, p_reference_id, p_notes, COALESCE(p_created_by, auth.uid()));
  
  RETURN v_new_hours;
END;
$$;

-- Create trigger function to auto-update accumulated hours from approved time entries
CREATE OR REPLACE FUNCTION public.update_accumulated_hours_from_time_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours NUMERIC;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Calculate hours from the time entry
    v_hours := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600.0;
    
    -- Subtract break time if present
    IF NEW.break_minutes IS NOT NULL THEN
      v_hours := v_hours - (NEW.break_minutes / 60.0);
    END IF;
    
    -- Add hours to employee's accumulated total
    PERFORM add_seniority_hours(NEW.employee_id, v_hours, 'time_entry', NEW.id, NULL, NULL);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on time_entries (only if it doesn't exist)
DROP TRIGGER IF EXISTS trigger_update_accumulated_hours ON time_entries;
CREATE TRIGGER trigger_update_accumulated_hours
AFTER INSERT OR UPDATE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION update_accumulated_hours_from_time_entry();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_seniority_log_employee_id ON seniority_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_seniority_log_created_at ON seniority_log(created_at DESC);