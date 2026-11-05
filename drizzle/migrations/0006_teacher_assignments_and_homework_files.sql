CREATE TABLE public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  class_name text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, class_name, subject)
);
GRANT SELECT, INSERT, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or leaders read assignments" ON public.teacher_assignments FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'head_teacher'));
CREATE POLICY "leaders add assignments" ON public.teacher_assignments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'head_teacher'));
CREATE POLICY "leaders remove assignments" ON public.teacher_assignments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'head_teacher'));

ALTER TABLE public.homework ADD COLUMN attachment_path text;
ALTER TABLE public.homework ADD COLUMN attachment_name text;

CREATE POLICY "staff upload homework files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'homework' AND public.is_staff(auth.uid()) AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "read visible homework files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'homework' AND (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.homework h WHERE h.attachment_path = storage.objects.name)));
CREATE POLICY "owner deletes homework files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'homework' AND (storage.foldername(name))[1] = auth.uid()::text);