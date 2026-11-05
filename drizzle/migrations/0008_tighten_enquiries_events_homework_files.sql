DROP POLICY IF EXISTS "Visitors submit enquiries" ON public.contact_enquiries;
CREATE POLICY "Visitors submit enquiries" ON public.contact_enquiries
FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(full_name)) BETWEEN 2 AND 120
  AND char_length(email) BETWEEN 5 AND 254
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(phone) <= 40
  AND char_length(btrim(message)) BETWEEN 5 AND 3000
);

DROP POLICY IF EXISTS "anyone reads events" ON public.events;
CREATE POLICY "anyone reads events" ON public.events
FOR SELECT TO anon, authenticated
USING (event_date >= (CURRENT_DATE - 365) OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read visible homework files" ON storage.objects;
CREATE POLICY "read visible homework files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'homework' AND (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.homework h
      WHERE h.attachment_path = objects.name
        AND h.published
        AND public.in_my_class(h.class_name)
    )
  )
);