# Configurar Supabase

Supabase se usa para:

- Autenticacion de usuarios.
- PostgreSQL.
- Storage de imagenes.
- Seguridad con Row Level Security.

## 1. Crear proyecto

1. Entra a Supabase.
2. Crea un proyecto.
3. Guarda:
   - Project URL.
   - Anon public key.
   - Service role key.

## 2. Configurar variables

Backend:

```txt
apps/api/.env
```

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

Mobile:

```txt
apps/mobile/.env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-public-anon-key
```

## 3. Aplicar migracion SQL

Archivo:

```txt
supabase/migrations/001_initial_schema.sql
```

Opcion simple:

1. Abre Supabase.
2. Ve a SQL Editor.
3. Copia el contenido de `001_initial_schema.sql`.
4. Ejecuta el script.

La migracion crea:

- tablas del dominio
- indices
- triggers `updated_at`
- RLS basico
- buckets privados de Storage

## 4. Cargar seed de ejercicios

Archivos:

```txt
supabase/seed/001_exercises.sql
supabase/seed/002_exercise_catalog.sql
```

En Supabase SQL Editor:

1. Ejecuta primero `001_exercises.sql`.
2. Ejecuta despues `002_exercise_catalog.sql`.

Esto agrega ejercicios base y luego amplia el catalogo con ejercicios rankeados para el modulo de rutinas.

## 5. Buckets de Storage

La migracion crea estos buckets privados:

```txt
meal-photos
machine-photos
progress-photos
```

La app sube imagenes con este patron:

```txt
{userId}/{profileId}/{timestamp}.jpg
```

Ejemplo:

```txt
8c4.../profile-id/1710000000000.jpg
```

## 6. Autenticacion

En Supabase:

```txt
Authentication > Providers > Email
```

Para desarrollo puedes elegir:

- Confirm email activado: mas seguro, pero debes revisar correo.
- Confirm email desactivado: mas rapido para probar.

Si login dice `email not confirmed`, confirma el correo o desactiva temporalmente la confirmacion en desarrollo.

## 7. RLS

RLS esta activado para las tablas principales. La regla general es:

- un usuario solo puede acceder a perfiles donde `profiles.user_id = auth.uid()`
- recursos como comidas, entrenamientos y metricas se acceden a traves de perfiles propios

Aunque el backend usa service role, RLS queda preparado para accesos directos futuros con anon key autenticada.

## 8. Importante antes de produccion

- Revisa todas las policies en Supabase.
- No expongas service role key.
- No expongas connection strings PostgreSQL.
- Rota cualquier password que haya sido compartida por error.
- Mueve firmado de URLs al backend.
- Agrega rate limit a endpoints IA.
