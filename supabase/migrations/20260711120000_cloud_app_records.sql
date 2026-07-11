create table if not exists public.app_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_key text not null,
  payload jsonb not null default 'null'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, record_key)
);

create index if not exists app_records_user_id_idx
  on public.app_records (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_records_set_updated_at on public.app_records;

create trigger app_records_set_updated_at
before update on public.app_records
for each row
execute function public.set_updated_at();

alter table public.app_records enable row level security;

drop policy if exists "Users can read their app records" on public.app_records;
drop policy if exists "Users can insert their app records" on public.app_records;
drop policy if exists "Users can update their app records" on public.app_records;
drop policy if exists "Users can delete their app records" on public.app_records;

create policy "Users can read their app records"
on public.app_records
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their app records"
on public.app_records
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their app records"
on public.app_records
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their app records"
on public.app_records
for delete
to authenticated
using ((select auth.uid()) = user_id);

do $$
begin
  alter publication supabase_realtime add table public.app_records;
exception
  when duplicate_object then null;
end;
$$;
