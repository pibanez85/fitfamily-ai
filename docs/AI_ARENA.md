# AI Arena

AI Arena es una base para comparar proveedores de IA en desarrollo.

No esta activa por defecto.

## Variable

```env
AI_ARENA_ENABLED=false
```

## Servicio

```txt
apps/api/src/services/ai/AIComparisonService.ts
```

## Objetivo

Poder mandar el mismo input a dos o mas proveedores y comparar:

- exactitud
- claridad
- seguridad
- utilidad practica
- JSON valido
- latencia aproximada

## Estado actual

Existe la estructura inicial para comparar, pero en MVP se mantiene desactivado para evitar:

- mayor costo
- mayor latencia
- mas procesamiento de datos sensibles
- ruido en desarrollo normal

## Proveedores futuros

La arquitectura permite agregar:

- `AnthropicProvider`
- `LocalMockProvider`
- modelos locales
- proveedores especializados en vision

## Tabla futura sugerida

```sql
create table public.ai_arena_runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  task text not null,
  input_metadata jsonb not null,
  provider_results jsonb not null,
  scores jsonb not null,
  created_at timestamptz not null default now()
);
```

## Reglas de seguridad

- No activar en produccion por defecto.
- No enviar datos sensibles innecesarios a multiples proveedores.
- Anonimizar inputs si es posible.
- Guardar solo metadata necesaria.
- Informar al usuario si sus datos se usan para comparacion.
