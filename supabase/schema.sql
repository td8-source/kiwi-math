-- Nature Maths cloud sync. Run this once in the Supabase SQL editor.
-- It creates one table for parent-account saves (protected by row-level security)
-- and one for family-code saves (reachable only through the two functions below,
-- which require the SHA-256 hash of the family code).

create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

drop policy if exists "own save" on public.saves;
create policy "own save" on public.saves
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.family_saves (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- No policies on family_saves: the anon role cannot touch the table directly.
alter table public.family_saves enable row level security;

create or replace function public.family_pull(p_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select state from public.family_saves where code_hash = p_hash;
$$;

create or replace function public.family_push(p_hash text, p_state jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.family_saves (code_hash, state, updated_at)
  values (p_hash, p_state, now())
  on conflict (code_hash) do update
    set state = excluded.state, updated_at = now();
$$;

revoke all on function public.family_pull(text) from public;
revoke all on function public.family_push(text, jsonb) from public;
grant execute on function public.family_pull(text) to anon, authenticated;
grant execute on function public.family_push(text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Bug reports from the in-app "Report a problem" button.
-- The anon key may insert, and nothing else: there is no select, update or delete
-- policy, so a report cannot be used to read anybody else's. A scheduled GitHub
-- Action (.github/workflows/bug-reports.yml) reads new rows with the service-role
-- key and opens an issue for each one.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  summary text not null check (char_length(summary) between 1 and 200),
  details text not null default '' check (char_length(details) <= 4000),
  body text not null default '' check (char_length(body) <= 20000),
  diagnostics jsonb not null default '{}'::jsonb check (char_length(diagnostics::text) <= 20000),
  app_version text not null default '' check (char_length(app_version) <= 40),
  status text not null default 'new' check (status in ('new', 'filed', 'failed')),
  issue_number integer,
  filed_at timestamptz
);

create index if not exists reports_new_idx on public.reports (created_at) where status = 'new';

alter table public.reports enable row level security;

drop policy if exists "anyone can report a problem" on public.reports;
create policy "anyone can report a problem" on public.reports
  for insert
  to anon, authenticated
  with check (true);
