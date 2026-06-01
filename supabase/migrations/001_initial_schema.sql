create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  birthdate date,
  sex text,
  height_cm numeric,
  goal text,
  activity_level text,
  dietary_preferences jsonb,
  training_preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  equipment text,
  instructions text,
  safety_notes text,
  created_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  day_index int not null,
  name text not null,
  notes text
);

create table public.workout_day_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  order_index int not null,
  target_sets int,
  target_reps text,
  target_weight numeric,
  rest_seconds int,
  notes text
);

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  workout_day_id uuid references public.workout_days(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  perceived_effort int,
  notes text,
  created_at timestamptz not null default now()
);

create table public.workout_log_sets (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references public.workout_logs(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  set_index int not null,
  reps int,
  weight numeric,
  rpe numeric,
  rest_seconds int,
  notes text,
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  meal_type text not null,
  eaten_at timestamptz not null default now(),
  name text,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  estimated_portion text,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  confidence numeric,
  created_at timestamptz not null default now()
);

create table public.food_photo_analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  estimated_meal_name text,
  detected_items jsonb not null default '[]',
  estimated_totals jsonb not null default '{}',
  confidence numeric,
  ai_provider text not null,
  ai_model text not null,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create table public.gym_machine_photo_analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  machine_name text,
  possible_exercises jsonb not null default '[]',
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  instructions jsonb not null default '[]',
  common_mistakes text[] not null default '{}',
  safety_recommendations text[] not null default '{}',
  avoid_if text[] not null default '{}',
  difficulty text,
  confidence numeric,
  ai_provider text not null,
  ai_model text not null,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create table public.ai_chat_threads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.ai_chat_threads(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_kg numeric,
  body_fat_percentage numeric,
  waist_cm numeric,
  chest_cm numeric,
  hip_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  taken_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();

create trigger meals_set_updated_at
before update on public.meals
for each row execute function public.set_updated_at();

create trigger ai_chat_threads_set_updated_at
before update on public.ai_chat_threads
for each row execute function public.set_updated_at();

create index profiles_user_id_idx on public.profiles(user_id);
create index profiles_created_at_idx on public.profiles(created_at);
create index workouts_profile_id_idx on public.workouts(profile_id);
create index workouts_created_at_idx on public.workouts(created_at);
create index workout_days_workout_id_idx on public.workout_days(workout_id);
create index workout_day_exercises_workout_day_id_idx on public.workout_day_exercises(workout_day_id);
create index workout_logs_profile_id_idx on public.workout_logs(profile_id);
create index workout_logs_created_at_idx on public.workout_logs(created_at);
create index workout_log_sets_workout_log_id_idx on public.workout_log_sets(workout_log_id);
create index workout_log_sets_created_at_idx on public.workout_log_sets(created_at);
create index meals_profile_id_idx on public.meals(profile_id);
create index meals_eaten_at_idx on public.meals(eaten_at);
create index meal_items_meal_id_idx on public.meal_items(meal_id);
create index food_photo_analyses_profile_id_idx on public.food_photo_analyses(profile_id);
create index food_photo_analyses_created_at_idx on public.food_photo_analyses(created_at);
create index gym_machine_photo_analyses_profile_id_idx on public.gym_machine_photo_analyses(profile_id);
create index gym_machine_photo_analyses_created_at_idx on public.gym_machine_photo_analyses(created_at);
create index ai_chat_threads_profile_id_idx on public.ai_chat_threads(profile_id);
create index ai_chat_threads_created_at_idx on public.ai_chat_threads(created_at);
create index ai_chat_messages_thread_id_idx on public.ai_chat_messages(thread_id);
create index ai_chat_messages_created_at_idx on public.ai_chat_messages(created_at);
create index body_metrics_profile_id_idx on public.body_metrics(profile_id);
create index body_metrics_measured_at_idx on public.body_metrics(measured_at);
create index progress_photos_profile_id_idx on public.progress_photos(profile_id);
create index progress_photos_created_at_idx on public.progress_photos(created_at);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_day_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_log_sets enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.food_photo_analyses enable row level security;
alter table public.gym_machine_photo_analyses enable row level security;
alter table public.ai_chat_threads enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.body_metrics enable row level security;
alter table public.progress_photos enable row level security;

create policy profiles_owner_select on public.profiles
for select using (auth.uid() = user_id);
create policy profiles_owner_insert on public.profiles
for insert with check (auth.uid() = user_id);
create policy profiles_owner_update on public.profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy profiles_owner_delete on public.profiles
for delete using (auth.uid() = user_id);

create policy exercises_authenticated_read on public.exercises
for select to authenticated using (true);

create policy exercises_authenticated_insert on public.exercises
for insert to authenticated with check (true);

create policy workouts_owner_all on public.workouts
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = workouts.profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = workouts.profile_id and p.user_id = auth.uid()
  )
);

create policy workout_days_owner_all on public.workout_days
for all using (
  exists (
    select 1 from public.workouts w
    join public.profiles p on p.id = w.profile_id
    where w.id = workout_days.workout_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.workouts w
    join public.profiles p on p.id = w.profile_id
    where w.id = workout_days.workout_id and p.user_id = auth.uid()
  )
);

create policy workout_day_exercises_owner_all on public.workout_day_exercises
for all using (
  exists (
    select 1 from public.workout_days wd
    join public.workouts w on w.id = wd.workout_id
    join public.profiles p on p.id = w.profile_id
    where wd.id = workout_day_exercises.workout_day_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.workout_days wd
    join public.workouts w on w.id = wd.workout_id
    join public.profiles p on p.id = w.profile_id
    where wd.id = workout_day_exercises.workout_day_id and p.user_id = auth.uid()
  )
);

create policy workout_logs_owner_all on public.workout_logs
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = workout_logs.profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = workout_logs.profile_id and p.user_id = auth.uid()
  )
);

create policy workout_log_sets_owner_all on public.workout_log_sets
for all using (
  exists (
    select 1 from public.workout_logs wl
    join public.profiles p on p.id = wl.profile_id
    where wl.id = workout_log_sets.workout_log_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.workout_logs wl
    join public.profiles p on p.id = wl.profile_id
    where wl.id = workout_log_sets.workout_log_id and p.user_id = auth.uid()
  )
);

create policy meals_owner_all on public.meals
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = meals.profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = meals.profile_id and p.user_id = auth.uid()
  )
);

create policy meal_items_owner_all on public.meal_items
for all using (
  exists (
    select 1 from public.meals m
    join public.profiles p on p.id = m.profile_id
    where m.id = meal_items.meal_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.meals m
    join public.profiles p on p.id = m.profile_id
    where m.id = meal_items.meal_id and p.user_id = auth.uid()
  )
);

create policy food_photo_analyses_owner_all on public.food_photo_analyses
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = food_photo_analyses.profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = food_photo_analyses.profile_id and p.user_id = auth.uid()
  )
);

create policy gym_machine_photo_analyses_owner_all on public.gym_machine_photo_analyses
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = gym_machine_photo_analyses.profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = gym_machine_photo_analyses.profile_id and p.user_id = auth.uid()
  )
);

create policy ai_chat_threads_owner_all on public.ai_chat_threads
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = ai_chat_threads.profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = ai_chat_threads.profile_id and p.user_id = auth.uid()
  )
);

create policy ai_chat_messages_owner_all on public.ai_chat_messages
for all using (
  exists (
    select 1 from public.ai_chat_threads t
    join public.profiles p on p.id = t.profile_id
    where t.id = ai_chat_messages.thread_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.ai_chat_threads t
    join public.profiles p on p.id = t.profile_id
    where t.id = ai_chat_messages.thread_id and p.user_id = auth.uid()
  )
);

create policy body_metrics_owner_all on public.body_metrics
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = body_metrics.profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = body_metrics.profile_id and p.user_id = auth.uid()
  )
);

create policy progress_photos_owner_all on public.progress_photos
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = progress_photos.profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = progress_photos.profile_id and p.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('meal-photos', 'meal-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('machine-photos', 'machine-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('progress-photos', 'progress-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy storage_owner_read on storage.objects
for select to authenticated using (
  bucket_id in ('meal-photos', 'machine-photos', 'progress-photos')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy storage_owner_insert on storage.objects
for insert to authenticated with check (
  bucket_id in ('meal-photos', 'machine-photos', 'progress-photos')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy storage_owner_update on storage.objects
for update to authenticated using (
  bucket_id in ('meal-photos', 'machine-photos', 'progress-photos')
  and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id in ('meal-photos', 'machine-photos', 'progress-photos')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy storage_owner_delete on storage.objects
for delete to authenticated using (
  bucket_id in ('meal-photos', 'machine-photos', 'progress-photos')
  and auth.uid()::text = (storage.foldername(name))[1]
);
