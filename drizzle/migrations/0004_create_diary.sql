CREATE TABLE public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  topics TEXT NOT NULL,
  teacher_id UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_name, entry_date, teacher_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diary_entries TO authenticated;
GRANT ALL ON public.diary_entries TO service_role;

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read diary" ON public.diary_entries FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "staff add diary" ON public.diary_entries FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()) AND teacher_id = auth.uid());
CREATE POLICY "owner or admin edit diary" ON public.diary_entries FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin delete diary" ON public.diary_entries FOR DELETE TO authenticated USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "family read diary" ON public.diary_entries FOR SELECT TO authenticated USING (in_my_class(class_name));