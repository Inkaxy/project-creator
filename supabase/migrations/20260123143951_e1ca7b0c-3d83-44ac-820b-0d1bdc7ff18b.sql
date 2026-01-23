-- Add column for controlling employee quota visibility
ALTER TABLE public.sick_leave_settings 
ADD COLUMN IF NOT EXISTS allow_employee_quota_view BOOLEAN DEFAULT true;