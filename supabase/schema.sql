create extension if not exists pgcrypto;

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diary_entries
  add column if not exists answers jsonb not null default '{}'::jsonb;

-- If you already ran an older schema, migrate legacy answer columns into
-- answers before dropping them.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'diary_entries'
      and column_name = 'daily'
  ) then
    execute $sql$
      update public.diary_entries
      set answers =
        coalesce(answers, '{}'::jsonb)
        || jsonb_strip_nulls(jsonb_build_object(
          'daily_what_happened', nullif(daily, ''),
          'emotion_strongest', nullif(emotion, ''),
          'learning_new', nullif(learning, ''),
          'growth_mistake', nullif(growth, ''),
          'action_different', nullif(action, '')
        ))
    $sql$;
  end if;
end $$;

-- If you already ran the earlier login-based schema, this converts it to a
-- single-user personal table. If multiple users wrote the same date before,
-- keep one row per date before creating the unique index below.
drop policy if exists "Users can read own diary entries" on public.diary_entries;
drop policy if exists "Users can insert own diary entries" on public.diary_entries;
drop policy if exists "Users can update own diary entries" on public.diary_entries;
drop policy if exists "Users can delete own diary entries" on public.diary_entries;

alter table public.diary_entries
  drop constraint if exists diary_entries_user_date_unique,
  drop constraint if exists diary_entries_user_id_fkey,
  drop column if exists user_id,
  drop column if exists daily,
  drop column if exists emotion,
  drop column if exists learning,
  drop column if exists growth,
  drop column if exists action;

alter table public.diary_entries
  add column if not exists entry_date date,
  add column if not exists answers jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

delete from public.diary_entries
where entry_date is null;

alter table public.diary_entries
  alter column entry_date set not null,
  alter column answers set not null;

drop index if exists diary_entries_user_date_idx;
drop index if exists diary_entries_entry_date_idx;
create unique index if not exists diary_entries_entry_date_unique_idx
  on public.diary_entries (entry_date);

create index if not exists diary_entries_entry_date_idx
  on public.diary_entries (entry_date desc);

alter table public.diary_entries enable row level security;

drop policy if exists "Anyone with anon key can read diary entries" on public.diary_entries;
create policy "Anyone with anon key can read diary entries"
  on public.diary_entries
  for select
  to anon
  using (true);

drop policy if exists "Anyone with anon key can insert diary entries" on public.diary_entries;
create policy "Anyone with anon key can insert diary entries"
  on public.diary_entries
  for insert
  to anon
  with check (true);

drop policy if exists "Anyone with anon key can update diary entries" on public.diary_entries;
create policy "Anyone with anon key can update diary entries"
  on public.diary_entries
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "Anyone with anon key can delete diary entries" on public.diary_entries;
create policy "Anyone with anon key can delete diary entries"
  on public.diary_entries
  for delete
  to anon
  using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_diary_entries_updated_at on public.diary_entries;
create trigger set_diary_entries_updated_at
  before update on public.diary_entries
  for each row
  execute function public.set_updated_at();
