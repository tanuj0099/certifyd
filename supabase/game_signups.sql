create table if not exists public.game_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.game_signups enable row level security;

revoke all on public.game_signups from anon, authenticated;
grant insert (name, email) on public.game_signups to anon;

drop policy if exists "Allow public game signup inserts" on public.game_signups;
create policy "Allow public game signup inserts"
  on public.game_signups
  for insert
  to anon
  with check (
    length(trim(name)) between 1 and 200
    and length(trim(email)) between 3 and 320
  );
