CREATE OR REPLACE FUNCTION public.can_manage_teacher(_target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'head_teacher') AND _target <> auth.uid() AND NOT public.has_role(_target, 'admin') AND NOT public.has_role(_target, 'head_teacher') $$;
REVOKE ALL ON FUNCTION public.can_manage_teacher(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_teacher(uuid) TO authenticated, service_role;
CREATE POLICY "head teacher read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'head_teacher'));
CREATE POLICY "head teacher read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'head_teacher'));
CREATE POLICY "head teacher assign teachers" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (role = 'teacher' AND public.can_manage_teacher(user_id));
CREATE POLICY "head teacher remove teachers" ON public.user_roles FOR DELETE TO authenticated USING (role = 'teacher' AND public.can_manage_teacher(user_id));
CREATE POLICY "head teacher read students" ON public.students FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'head_teacher'));
CREATE POLICY "head teacher add students" ON public.students FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'head_teacher'));
CREATE POLICY "head teacher update students" ON public.students FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'head_teacher')) WITH CHECK (public.has_role(auth.uid(), 'head_teacher'));
CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(_uid, 'admin') OR public.has_role(_uid, 'head_teacher') OR public.has_role(_uid, 'teacher') $$;