-- Drop the restrictive SELECT policy for profiles
DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.profiles;

-- Create new policy that allows all authenticated users to view all active profiles
-- This is appropriate for an employee directory where colleagues need to see each other
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);