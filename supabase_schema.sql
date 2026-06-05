-- ZOESTRENGTH Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text check (plan in ('monthly', 'annual')) not null,
  status text check (status in ('trialing', 'active', 'canceled', 'past_due', 'inactive')) default 'inactive',
  trial_end timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Helper function: is user subscribed?
create or replace function public.is_subscribed(user_uuid uuid)
returns boolean as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
    and status in ('active', 'trialing')
    and (current_period_end is null or current_period_end > now())
  );
$$ language sql security definer;

-- ─────────────────────────────────────────────
-- PROGRAMS
-- ─────────────────────────────────────────────
create table public.programs (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  duration_weeks int,
  days_per_week int,
  level text check (level in ('beginner', 'intermediate', 'advanced')) default 'intermediate',
  category text check (category in ('strength', 'run', 'hybrid', 'cycle')) default 'strength',
  color text default '#C8F500',
  text_color text default '#0D0D0D',
  cover_image_url text,
  is_published boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.programs enable row level security;
create policy "Published programs visible to subscribers" on public.programs
  for select using (
    is_published = true and public.is_subscribed(auth.uid())
  );
create policy "Admin can manage programs" on public.programs
  for all using (auth.jwt() ->> 'email' = 'sabrina@cancercolab.ca');

-- ─────────────────────────────────────────────
-- PROGRAM PDFS / EXTRAS
-- ─────────────────────────────────────────────
create table public.program_resources (
  id uuid default uuid_generate_v4() primary key,
  program_id uuid references public.programs(id) on delete cascade,
  name text not null,
  description text,
  file_url text not null,
  resource_type text check (resource_type in ('pdf', 'guide', 'video', 'other')) default 'pdf',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.program_resources enable row level security;
create policy "Resources visible to subscribers" on public.program_resources
  for select using (public.is_subscribed(auth.uid()));
create policy "Admin can manage resources" on public.program_resources
  for all using (auth.jwt() ->> 'email' = 'sabrina@cancercolab.ca');

-- ─────────────────────────────────────────────
-- WEEKS
-- ─────────────────────────────────────────────
create table public.weeks (
  id uuid default uuid_generate_v4() primary key,
  program_id uuid references public.programs(id) on delete cascade not null,
  week_number int not null,
  title text,
  notes text,
  is_deload boolean default false,
  created_at timestamptz default now(),
  unique(program_id, week_number)
);

alter table public.weeks enable row level security;
create policy "Weeks visible to subscribers" on public.weeks
  for select using (public.is_subscribed(auth.uid()));
create policy "Admin can manage weeks" on public.weeks
  for all using (auth.jwt() ->> 'email' = 'sabrina@cancercolab.ca');

-- ─────────────────────────────────────────────
-- WORKOUTS (sessions within a week)
-- ─────────────────────────────────────────────
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.weeks(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete cascade not null,
  day_number int not null,
  title text not null,
  description text,
  estimated_duration_mins int,
  workout_type text check (workout_type in ('strength', 'run', 'hybrid', 'mobility', 'sit')) default 'strength',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.workouts enable row level security;
create policy "Workouts visible to subscribers" on public.workouts
  for select using (public.is_subscribed(auth.uid()));
create policy "Admin can manage workouts" on public.workouts
  for all using (auth.jwt() ->> 'email' = 'sabrina@cancercolab.ca');

-- ─────────────────────────────────────────────
-- EXERCISES (master library)
-- ─────────────────────────────────────────────
create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  cues text[], -- array of coaching cues
  muscle_groups text[],
  equipment text[],
  video_url text, -- YouTube/Vimeo embed URL
  thumbnail_url text,
  created_at timestamptz default now()
);

alter table public.exercises enable row level security;
create policy "Exercises visible to subscribers" on public.exercises
  for select using (public.is_subscribed(auth.uid()));
create policy "Admin can manage exercises" on public.exercises
  for all using (auth.jwt() ->> 'email' = 'sabrina@cancercolab.ca');

-- ─────────────────────────────────────────────
-- WORKOUT EXERCISES (exercises within a workout)
-- ─────────────────────────────────────────────
create table public.workout_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  sets int not null default 3,
  reps text not null, -- e.g. "4-4-4-4" or "8-10" or "45 sec"
  rest_seconds int default 90,
  tempo text, -- e.g. "3-1-1"
  notes text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.workout_exercises enable row level security;
create policy "Workout exercises visible to subscribers" on public.workout_exercises
  for select using (public.is_subscribed(auth.uid()));
create policy "Admin can manage workout exercises" on public.workout_exercises
  for all using (auth.jwt() ->> 'email' = 'sabrina@cancercolab.ca');

-- ─────────────────────────────────────────────
-- USER WORKOUT COMPLETIONS
-- ─────────────────────────────────────────────
create table public.workout_completions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  completed_at timestamptz default now(),
  duration_mins int,
  notes text,
  unique(user_id, workout_id)
);

alter table public.workout_completions enable row level security;
create policy "Users can manage own completions" on public.workout_completions
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- SET LOGS (weight + reps per set per session)
-- ─────────────────────────────────────────────
create table public.set_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  workout_exercise_id uuid references public.workout_exercises(id) on delete cascade not null,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  set_number int not null,
  weight_kg numeric(6,2),
  reps_completed int,
  completed boolean default false,
  logged_at timestamptz default now()
);

alter table public.set_logs enable row level security;
create policy "Users can manage own set logs" on public.set_logs
  for all using (auth.uid() = user_id);

-- Index for fast "previous session" lookups
create index set_logs_user_exercise_idx on public.set_logs(user_id, workout_exercise_id, logged_at desc);

-- ─────────────────────────────────────────────
-- USER PROGRAM ENROLLMENTS
-- ─────────────────────────────────────────────
create table public.program_enrollments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  active boolean default true,
  unique(user_id, program_id)
);

alter table public.program_enrollments enable row level security;
create policy "Users can manage own enrollments" on public.program_enrollments
  for all using (auth.uid() = user_id);
