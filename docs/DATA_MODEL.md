# Modelo de datos

La base de datos vive en Supabase PostgreSQL.

Migracion principal:

```txt
supabase/migrations/001_initial_schema.sql
```

Seed inicial:

```txt
supabase/seed/001_exercises.sql
supabase/seed/002_exercise_catalog.sql
```

## Tablas principales

## profiles

Perfil familiar asociado a un usuario de Supabase Auth.

Campos importantes:

- `id`
- `user_id`
- `display_name`
- `birthdate`
- `sex`
- `height_cm`
- `goal`
- `activity_level`
- `dietary_preferences`
- `training_preferences`
- `created_at`
- `updated_at`

Relaciones:

- `profiles.user_id` apunta a `auth.users.id`

## exercises

Catalogo de ejercicios.

Campos importantes:

- `name`
- `category`
- `primary_muscles`
- `secondary_muscles`
- `equipment`
- `instructions`
- `safety_notes`

El frontend y la API enriquecen este catalogo con metadata compartida de seleccion:

- score de prioridad practica
- tier: principal, excelente, accesorio, aislamiento o situacional
- patron de movimiento
- region corporal
- musculos usados para filtros
- series, repeticiones y descansos por defecto

La metadata vive en:

```txt
packages/shared/src/exerciseLibrary.ts
```

## workouts

Rutinas de un perfil.

Campos importantes:

- `profile_id`
- `name`
- `description`
- `goal`

## workout_days

Dias dentro de una rutina.

Campos importantes:

- `workout_id`
- `day_index`
- `name`
- `notes`

## workout_day_exercises

Ejercicios planificados en un dia.

Campos importantes:

- `workout_day_id`
- `exercise_id`
- `order_index`
- `target_sets`
- `target_reps`
- `target_weight`
- `rest_seconds`
- `notes`

## workout_logs

Entrenamientos realizados.

Campos importantes:

- `profile_id`
- `workout_id`
- `workout_day_id`
- `started_at`
- `ended_at`
- `perceived_effort`
- `notes`

## workout_log_sets

Series reales dentro de un entrenamiento.

Campos importantes:

- `workout_log_id`
- `exercise_id`
- `set_index`
- `reps`
- `weight`
- `rpe`
- `rest_seconds`
- `notes`

## meals

Comidas registradas.

Campos importantes:

- `profile_id`
- `meal_type`
- `eaten_at`
- `name`
- `calories`
- `protein_g`
- `carbs_g`
- `fat_g`
- `fiber_g`
- `notes`

## meal_items

Alimentos individuales dentro de una comida.

Campos importantes:

- `meal_id`
- `name`
- `estimated_portion`
- `calories`
- `protein_g`
- `carbs_g`
- `fat_g`
- `fiber_g`
- `confidence`

## food_photo_analyses

Resultado bruto y normalizado de analisis IA de comida.

## food_items_cache

Cache preparado para alimentos consultados desde proveedores externos.

Campos principales:

- `source`
- `source_id`
- `name`
- `brand`
- `category`
- `aliases`
- `serving_options`
- macros por 100 g
- `barcode`
- `image_url`
- `is_verified`
- `is_estimated`
- `raw_response`
- `last_seen_at`

En el MVP el backend usa cache en memoria para busquedas; esta tabla queda lista para persistir resultados externos antes de produccion.

Campos importantes:

- `profile_id`
- `image_url`
- `estimated_meal_name`
- `detected_items`
- `estimated_totals`
- `confidence`
- `ai_provider`
- `ai_model`
- `raw_response`

## gym_machine_photo_analyses

Resultado de analisis IA de maquinas de gimnasio.

Campos importantes:

- `profile_id`
- `image_url`
- `machine_name`
- `possible_exercises`
- `primary_muscles`
- `secondary_muscles`
- `instructions`
- `common_mistakes`
- `safety_recommendations`
- `avoid_if`
- `difficulty`
- `confidence`
- `ai_provider`
- `ai_model`
- `raw_response`

## ai_chat_threads

Conversaciones IA por perfil.

Campos importantes:

- `profile_id`
- `title`
- `created_at`
- `updated_at`

## ai_chat_messages

Mensajes de chat IA.

Campos importantes:

- `thread_id`
- `role`
- `content`
- `metadata`
- `created_at`

Roles:

- `user`
- `assistant`
- `system`

## body_metrics

Metricas corporales.

Campos importantes:

- `profile_id`
- `measured_at`
- `weight_kg`
- `body_fat_percentage`
- `waist_cm`
- `chest_cm`
- `hip_cm`
- `arm_cm`
- `thigh_cm`
- `notes`

## progress_photos

Fotos de progreso.

Campos importantes:

- `profile_id`
- `image_url`
- `taken_at`
- `notes`

## Indices

La migracion incluye indices para:

- `profile_id`
- `created_at`
- `eaten_at`
- `measured_at`
- `workout_log_id`
- `thread_id`

Estos indices aceleran:

- dashboard semanal
- comidas por perfil
- entrenamientos por perfil
- metricas recientes
- mensajes por thread

## Convencion de nombres

Base de datos:

- snake_case
- ejemplo: `profile_id`, `created_at`

TypeScript/API:

- camelCase
- ejemplo: `profileId`, `createdAt`

La API convierte datos usando helpers internos para entregar respuestas mas comodas al frontend.
