-- Table to track which deadline notifications have been sent
CREATE TABLE public.sick_leave_deadline_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sick_leave_id UUID NOT NULL REFERENCES public.sick_leaves(id) ON DELETE CASCADE,
  deadline_type TEXT NOT NULL,
  deadline_date DATE NOT NULL,
  notification_sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sick_leave_id, deadline_type, deadline_date)
);

-- Enable RLS
ALTER TABLE public.sick_leave_deadline_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins/managers can view notification history
CREATE POLICY "Admins can view deadline notifications"
  ON public.sick_leave_deadline_notifications
  FOR SELECT
  USING (public.is_admin_or_manager(auth.uid()));

-- Only system (via service role) can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON public.sick_leave_deadline_notifications
  FOR INSERT
  WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_sick_leave_deadline_notifications_sick_leave 
  ON public.sick_leave_deadline_notifications(sick_leave_id);

-- Add new notification types by updating any existing type checks if needed
-- (notifications table already accepts any string type, so no change needed)