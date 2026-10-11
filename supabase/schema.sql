-- Hotel Aurora PMS - esquema inicial para Supabase
-- Execute este arquivo no SQL Editor do projeto Supabase.
-- O script foi escrito para poder ser executado novamente sem duplicar dados-base.

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('admin', 'manager', 'reception', 'housekeeping', 'finance');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.room_status as enum ('available', 'occupied', 'cleaning', 'maintenance', 'blocked');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.reservation_status as enum ('pending', 'confirmed', 'reserved', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.stay_status as enum ('expected', 'checked_in', 'checked_out', 'no_show');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_method as enum ('pix', 'credit_card', 'debit_card', 'cash', 'other');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('pending', 'partial', 'paid', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.expense_status as enum ('pending', 'paid', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.housekeeping_status as enum ('pending', 'in_progress', 'completed', 'maintenance');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Usuário do hotel',
  role public.user_role not null default 'reception',
  hotel_name text not null default 'Hotel Aurora',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  max_guests integer not null default 2 check (max_guests > 0),
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  color text not null default '#3978f6',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  room_type_id uuid not null references public.room_types(id) on delete restrict,
  floor integer not null default 1,
  status public.room_status not null default 'available',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  document text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  guest_id uuid not null references public.guests(id) on delete restrict,
  room_id uuid references public.rooms(id) on delete set null,
  check_in date not null,
  check_out date not null,
  adults integer not null default 1 check (adults > 0),
  children integer not null default 0 check (children >= 0),
  origin text not null default 'Balcão',
  status public.reservation_status not null default 'pending',
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_valid_dates check (check_out > check_in)
);

create table if not exists public.stays (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  reservation_id uuid unique references public.reservations(id) on delete set null,
  guest_id uuid not null references public.guests(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  check_in timestamptz not null default now(),
  check_out timestamptz,
  status public.stay_status not null default 'expected',
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stays_valid_dates check (check_out is null or check_out > check_in)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id) on delete set null,
  stay_id uuid references public.stays(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  method public.payment_method not null default 'pix',
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint payments_parent_check check (reservation_id is not null or stay_id is not null)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  description text not null,
  category text not null default 'Outros',
  amount numeric(12,2) not null check (amount >= 0),
  status public.expense_status not null default 'pending',
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.housekeeping_tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  status public.housekeeping_status not null default 'pending',
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null default auth.uid(),
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reservations_dates_idx on public.reservations (check_in, check_out);
create index if not exists reservations_status_idx on public.reservations (status);
create index if not exists stays_status_idx on public.stays (status);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists expenses_date_idx on public.expenses (expense_date);
create index if not exists housekeeping_room_idx on public.housekeeping_tasks (room_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists room_types_set_updated_at on public.room_types;
create trigger room_types_set_updated_at before update on public.room_types
for each row execute function public.set_updated_at();

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at before update on public.rooms
for each row execute function public.set_updated_at();

drop trigger if exists guests_set_updated_at on public.guests;
create trigger guests_set_updated_at before update on public.guests
for each row execute function public.set_updated_at();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at before update on public.reservations
for each row execute function public.set_updated_at();

drop trigger if exists stays_set_updated_at on public.stays;
create trigger stays_set_updated_at before update on public.stays
for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists housekeeping_tasks_set_updated_at on public.housekeeping_tasks;
create trigger housekeeping_tasks_set_updated_at before update on public.housekeeping_tasks
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, 'Usuário'), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Segurança inicial: o painel só poderá acessar dados com sessão autenticada.
-- Regras mais granulares por cargo serão adicionadas quando o login entrar no protótipo.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'room_types', 'rooms', 'guests', 'reservations', 'stays',
    'payments', 'expenses', 'housekeeping_tasks', 'audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_select on public.%I', table_name);
    execute format('drop policy if exists authenticated_insert on public.%I', table_name);
    execute format('drop policy if exists authenticated_update on public.%I', table_name);
    execute format('drop policy if exists authenticated_delete on public.%I', table_name);
    execute format('create policy authenticated_select on public.%I for select to authenticated using (true)', table_name);
    execute format('create policy authenticated_insert on public.%I for insert to authenticated with check (true)', table_name);
    execute format('create policy authenticated_update on public.%I for update to authenticated using (true) with check (true)', table_name);
    execute format('create policy authenticated_delete on public.%I for delete to authenticated using (true)', table_name);
  end loop;
end $$;

-- Dados-base sem dados pessoais reais.
insert into public.room_types (name, description, max_guests, base_price, color)
values
  ('Simples', 'Quarto para uma ou duas pessoas', 2, 220, '#3978f6'),
  ('Duplo', 'Quarto confortável para duas pessoas', 2, 320, '#20b59c'),
  ('Triplo', 'Quarto para até três pessoas', 3, 420, '#8b5cf6'),
  ('Suíte', 'Suíte ampla com área de estar', 4, 560, '#f59e0b')
on conflict (name) do nothing;

insert into public.rooms (number, room_type_id, floor, status)
select source.number, room_types.id, source.floor, source.status::public.room_status
from (values
  ('101', 'Simples', 1, 'occupied'), ('102', 'Duplo', 1, 'cleaning'),
  ('103', 'Simples', 1, 'available'), ('104', 'Duplo', 1, 'occupied'),
  ('105', 'Simples', 1, 'available'), ('201', 'Triplo', 2, 'occupied'),
  ('202', 'Duplo', 2, 'available'), ('203', 'Duplo', 2, 'maintenance'),
  ('204', 'Suíte', 2, 'occupied'), ('301', 'Simples', 3, 'available'),
  ('302', 'Suíte', 3, 'occupied'), ('305', 'Suíte', 3, 'occupied')
) as source(number, type_name, floor, status)
join public.room_types on room_types.name = source.type_name
on conflict (number) do nothing;
