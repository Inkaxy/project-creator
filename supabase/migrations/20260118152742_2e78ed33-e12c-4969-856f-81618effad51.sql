-- Fix overly permissive INSERT policy - only allow inserting notifications for the user themselves or by managers
DROP POLICY "Authenticated users can receive notifications" ON public.notifications;

-- Allow users to insert notifications for themselves (e.g., system-triggered)
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow managers to insert notifications for any user
CREATE POLICY "Managers can insert notifications for others"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin_or_manager(auth.uid()));