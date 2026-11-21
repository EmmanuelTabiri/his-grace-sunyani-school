DROP POLICY IF EXISTS "Signed-in users read school settings" ON public.school_settings;
CREATE POLICY "Portal members read school settings" ON public.school_settings
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));