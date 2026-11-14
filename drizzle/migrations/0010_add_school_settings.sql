CREATE TABLE public.school_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  school_name TEXT NOT NULL CHECK (char_length(school_name) BETWEEN 2 AND 160),
  location TEXT NOT NULL CHECK (char_length(location) BETWEEN 2 AND 200),
  academic_year TEXT NOT NULL CHECK (academic_year ~ '^\d{4}/\d{4}$'),
  current_term TEXT NOT NULL CHECK (current_term IN ('Term 1', 'Term 2', 'Term 3')),
  contact_email TEXT CHECK (contact_email IS NULL OR char_length(contact_email) <= 254),
  contact_phone TEXT CHECK (contact_phone IS NULL OR char_length(contact_phone) <= 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.school_settings TO authenticated;
GRANT ALL ON public.school_settings TO service_role;

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users read school settings"
ON public.school_settings FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "Administrators create school settings"
ON public.school_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Administrators update school settings"
ON public.school_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));