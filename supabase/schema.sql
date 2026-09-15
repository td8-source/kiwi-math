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
