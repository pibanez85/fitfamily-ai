create table if not exists public.food_items_cache (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text,
  name text not null,
  brand text,
  category text,
  country text,
  aliases text[] default '{}',
  serving_options jsonb not null default '[]'::jsonb,
  base_quantity numeric not null default 100,
  base_unit text not null default 'g',
  grams_per_base_unit numeric not null default 100,
  calories_per_100g numeric,
  protein_per_100g numeric,
  carbs_per_100g numeric,
  fat_per_100g numeric,
  fiber_per_100g numeric,
  sugar_per_100g numeric,
  sodium_per_100g numeric,
  barcode text,
  image_url text,
  is_verified boolean not null default false,
  is_estimated boolean not null default true,
  raw_response jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists food_items_cache_source_idx on public.food_items_cache(source);
create index if not exists food_items_cache_name_idx on public.food_items_cache using gin (to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(brand, '')));
create index if not exists food_items_cache_barcode_idx on public.food_items_cache(barcode);
create index if not exists food_items_cache_last_seen_at_idx on public.food_items_cache(last_seen_at);

alter table public.food_items_cache enable row level security;

create policy food_items_cache_authenticated_read on public.food_items_cache
for select
to authenticated
using (true);
