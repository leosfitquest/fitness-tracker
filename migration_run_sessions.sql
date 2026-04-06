create table public.run_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone not null,
  duration_seconds integer not null,
  distance_km numeric(10,3) not null,
  avg_pace_min_km numeric(10,3) not null,
  calories_burned integer,
  run_type text check (run_type in ('easy', 'tempo', 'interval', 'long', 'sprint', 'race')),
  elevation_gain numeric(10,2),
  notes text,
  route jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default now()
);

-- Turn on row level security
alter table public.run_sessions enable row level security;

-- Policies
create policy "Users can view their own run sessions" on public.run_sessions
  for select using (auth.uid() = user_id);

create policy "Users can view friends' run sessions (via feed)" on public.run_sessions
  for select using (true); -- Relaxed for feed visibility if needed, or adjust to 'is_shared' pattern

create policy "Users can insert their own run sessions" on public.run_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own run sessions" on public.run_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own run sessions" on public.run_sessions
  for delete using (auth.uid() = user_id);

-- Indexes for performance
create index run_sessions_user_id_idx on public.run_sessions(user_id);
create index run_sessions_started_at_idx on public.run_sessions(started_at);
