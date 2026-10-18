create type public.app_role as enum ('admin','teacher','student','parent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own or admin read profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'teacher'));
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid());
create policy "admin update profiles" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "read own or admin roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin add roles" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin remove roles" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email,''));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  class_name text not null default '',
  student_user_id uuid,
  guardian_user_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;

create or replace function public.can_view_student(_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students s where s.id = _student_id
    and (s.student_user_id = auth.uid() or s.guardian_user_id = auth.uid()))
$$;

create policy "admin manage students" on public.students for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "teacher read students" on public.students for select to authenticated using (public.has_role(auth.uid(),'teacher'));
create policy "linked read student" on public.students for select to authenticated
  using (student_user_id = auth.uid() or guardian_user_id = auth.uid());

create sequence public.receipt_seq start 1001;

create table public.fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'unpaid' check (status in ('unpaid','paid')),
  payment_method text,
  paid_on date,
  receipt_no text unique,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.fees to authenticated;
grant all on public.fees to service_role;
grant usage on sequence public.receipt_seq to authenticated;
alter table public.fees enable row level security;

create or replace function public.fees_set_receipt()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'paid' then
    if new.paid_on is null then new.paid_on := current_date; end if;
    if new.payment_method is null or new.payment_method = '' then raise exception 'Payment method is required for paid fees'; end if;
    if new.receipt_no is null then
      new.receipt_no := 'HGA-' || to_char(now(),'YYYY') || '-' || nextval('public.receipt_seq');
    end if;
  else
    new.receipt_no := null; new.paid_on := null;
  end if;
  return new;
end $$;
create trigger fees_receipt before insert or update on public.fees
  for each row execute function public.fees_set_receipt();

create policy "admin manage fees" on public.fees for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "linked read fees" on public.fees for select to authenticated using (public.can_view_student(student_id));