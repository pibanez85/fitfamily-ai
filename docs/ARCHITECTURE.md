# Arquitectura

FitFamily AI usa un monorepo simple con separacion clara entre mobile, backend, shared y Supabase.

## Vista general

```txt
Expo mobile
  |
  | Supabase Auth para login
  | Bearer token hacia API
  v
Express API
  |
  | valida JWT, ownership y payloads
  v
Supabase PostgreSQL + Storage
  |
  | solo backend llama a OpenAI
  v
OpenAI API
```

## Monorepo

```txt
fitfamily-ai/
  apps/
    mobile/
    api/
  packages/
    shared/
  supabase/
    migrations/
    seed/
  docs/
```

## Mobile

Ubicacion:

```txt
apps/mobile
```

Responsabilidades:

- UI y navegacion.
- Login/registro con Supabase Auth.
- Manejo de sesion local.
- Seleccion de perfil activo.
- Subida de fotos a Supabase Storage.
- Llamadas al backend con Bearer token.
- No contiene claves privadas.
- No llama a OpenAI directamente.

Patrones:

- `app/` contiene pantallas Expo Router.
- `src/components/` contiene UI reutilizable.
- `src/services/api.ts` contiene cliente REST.
- `src/services/restTimerFeedback.ts` encapsula avisos de descanso con haptics/notificaciones.
- `src/lib/supabase.ts` contiene cliente Supabase mobile.
- `src/store/appStore.ts` contiene estado global Zustand.

## Rutinas y entrenamiento

La creacion de rutina reutiliza `workouts.description` para guardar instrucciones personales de IA con un marcador legible. Esto evita una migracion en el MVP y mantiene compatible el contrato actual.

El registro de entrenamiento carga la rutina real, permite elegir el dia y registra series contra `workout_logs` y `workout_log_sets`. Las sugerencias IA se pueden aplicar:

- solo por hoy, como nota del entrenamiento
- a la rutina base, como nota persistida en `workouts.description`

El reemplazo estructural de ejercicios permanentes queda preparado para una siguiente iteracion con endpoint especifico sobre `workout_day_exercises`.

## API

Ubicacion:

```txt
apps/api
```

Responsabilidades:

- Validar JWT de Supabase.
- Validar inputs con Zod.
- Verificar ownership de perfiles y recursos.
- Leer/escribir en Supabase con service role.
- Encapsular IA.
- Devolver errores JSON seguros.

Flujo de una ruta privada:

```txt
request
  -> requireAuth
  -> validateParams / validateBody
  -> OwnershipService
  -> DataService / AIProvider
  -> response JSON
```

Archivos clave:

```txt
src/app.ts
src/middleware/auth.ts
src/middleware/validate.ts
src/middleware/errorHandler.ts
src/services/dataService.ts
src/services/ownership.ts
src/services/supabase.ts
src/services/ai/
```

## Shared

Ubicacion:

```txt
packages/shared
```

Responsabilidades:

- Tipos TypeScript compartidos.
- Esquemas Zod compartidos.
- Constantes del dominio.
- Contratos principales de API e IA.

Esto evita duplicar reglas entre mobile y backend.

## IA

Interfaz:

```ts
interface AIProvider {
  analyzeFoodPhoto(input): Promise<FoodAnalysisResult>
  analyzeGymMachinePhoto(input): Promise<GymMachineAnalysisResult>
  chat(input): Promise<AIChatResult>
}
```

Implementaciones actuales:

- `OpenAIProvider`
- `MockProvider`

Preparado para:

- `AnthropicProvider`
- proveedores locales
- comparacion en AI Arena

Regla clave:

```txt
OpenAI solo se llama desde apps/api.
```

## Supabase

Supabase provee:

- Auth
- PostgreSQL
- Storage
- RLS

La migracion crea:

- tablas
- indices
- triggers `updated_at`
- RLS basico
- buckets privados

## Seguridad de ownership

El backend no confia en `profileId` recibido por el cliente.

Antes de consultar o modificar recursos:

1. valida token
2. obtiene `user.id`
3. verifica que el perfil pertenece al usuario
4. verifica que el recurso pertenece a ese perfil

## Decisiones actuales

## Expo Router

Se eligio Expo Router porque simplifica pantallas y navegacion en Expo.

## Express modular

Express es suficiente para MVP, simple de entender y facil de desplegar.

## Zod compartido

Permite validar:

- formularios
- requests
- resultados IA
- contratos comunes

## Service role solo en backend

El backend usa service role para tener control centralizado. Mobile usa solo anon key publica.

## Pendientes arquitectonicos

- Generar tipos desde Supabase.
- Mover firmado de URLs de Storage al backend.
- Agregar paginacion y filtros avanzados.
- Agregar jobs o cola para tareas IA pesadas.
- Agregar cache para dashboard.
- Agregar observabilidad productiva.
