create or replace function public.is_staff(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_uid,'admin') or public.has_role(_uid,'teacher')
$$;

create or replace function public.in_my_class(_class text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students s where s.class_name = _class
    and (s.student_user_id = auth.uid() or s.guardian_user_id = auth.uid()))
$$;

create table public.marks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject text not null,
  assessment text not null,
  term text not null,
  score numeric(6,2) not null,
  max_score numeric(6,2) not null default 100,
  comment text,
  published boolean not null default false,
  teacher_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint marks_score_range check (max_score > 0 and score >= 0 and score <= max_score)
);
grant select, insert, update, delete on public.marks to authenticated;
grant all on public.marks to service_role;
alter table public.marks enable row level security;
create policy "staff read marks" on public.marks for select to authenticated using (public.is_staff(auth.uid()));
create policy "family read published marks" on public.marks for select to authenticated using (published and public.can_view_student(student_id));
create policy "staff add marks" on public.marks for insert to authenticated with check (public.is_staff(auth.uid()) and teacher_id = auth.uid());
create policy "owner or admin edit marks" on public.marks for update to authenticated using (teacher_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "owner or admin delete marks" on public.marks for delete to authenticated using (teacher_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructions text not null default '',
  subject text not null,
  class_name text not null,
  due_date date not null,
  published boolean not null default false,
  teacher_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.homework to authenticated;
grant all on public.homework to service_role;
alter table public.homework enable row level security;
create policy "staff read homework" on public.homework for select to authenticated using (public.is_staff(auth.uid()));
create policy "family read homework" on public.homework for select to authenticated using (published and public.in_my_class(class_name));
create policy "staff add homework" on public.homework for insert to authenticated with check (public.is_staff(auth.uid()) and teacher_id = auth.uid());
create policy "owner or admin edit homework" on public.homework for update to authenticated using (teacher_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "owner or admin delete homework" on public.homework for delete to authenticated using (teacher_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  class_name text,
  author_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "staff read announcements" on public.announcements for select to authenticated using (public.is_staff(auth.uid()));
create policy "family read announcements" on public.announcements for select to authenticated using (class_name is null or public.in_my_class(class_name));
create policy "staff post announcements" on public.announcements for insert to authenticated with check (public.is_staff(auth.uid()) and author_id = auth.uid());
create policy "owner or admin delete announcements" on public.announcements for delete to authenticated using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));