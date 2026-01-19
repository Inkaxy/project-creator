-- Fix the overly permissive RLS policy for handbook_versions
DROP POLICY IF EXISTS "Versions are viewable by all authenticated users" ON public.handbook_versions;

CREATE POLICY "Versions are viewable for published handbooks"
ON public.handbook_versions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.handbook h 
    WHERE h.id = handbook_id 
    AND (h.status = 'published' OR public.is_admin_or_manager(auth.uid()))
  )
);