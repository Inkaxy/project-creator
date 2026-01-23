-- Add new sick leave notification types to the check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'timesheet_approved', 
  'timesheet_rejected', 
  'timesheet_auto_approved',
  'daily_timesheet_summary',
  'shift_assigned', 
  'shift_changed', 
  'approval_request',
  'sick_leave_deadline_warning',
  'sick_leave_deadline_overdue', 
  'sick_leave_registered',
  'general'
));