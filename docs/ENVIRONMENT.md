# Variables de entorno

FitFamily AI usa variables separadas para mobile y backend.

## Archivos

```txt
.env.example
apps/api/.env.example
apps/mobile/.env.example
```

Archivos reales que debes crear localmente:

```txt
apps/api/.env
apps/mobile/.env
```

Los archivos `.env` reales no deben subirse a Git.

## API

Archivo:

```txt
apps/api/.env
```

Ejemplo:

```env
NODE_ENV=development
PORT=4000
API_BASE_URL=http://localhost:4000

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-solo-backend

OPENAI_API_KEY=sk-tu-key-solo-backend
AI_PROVIDER=openai
AI_MODEL_TEXT=gpt-5.4-mini
AI_MODEL_VISION=gpt-5.4-mini
AI_ARENA_ENABLED=false

OPEN_FOOD_FACTS_BASE_URL=https://world.openfoodfacts.org
OPEN_FOOD_FACTS_USER_AGENT=FitFamilyAI/0.1 (dev; contact: tu-email@example.com)
USDA_API_KEY=
```

Notas:

- `SUPABASE_SERVICE_ROLE_KEY` nunca va en mobile.
- `OPENAI_API_KEY` nunca va en mobile.
- `AI_PROVIDER=mock` permite probar sin llamar a OpenAI.
- `AI_PROVIDER=openai` requiere `OPENAI_API_KEY`.
- `USDA_API_KEY` es opcional; si esta vacia, el backend omite USDA sin romper la busqueda.
- `OPEN_FOOD_FACTS_USER_AGENT` debe identificar la app cuando se consulta Open Food Facts.

## Mobile

Archivo:

```txt
apps/mobile/.env
```

Ejemplo para Expo Go en celular:

```env
EXPO_PUBLIC_API_URL=http://192.168.2.55:4000
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-public-anon-key
```

`EXPO_PUBLIC_API_URL` debe apuntar a la IP local del PC, no a `localhost`, cuando usas el celular.

Para ver la IP del PC:

```bat
ipconfig
```

Busca:

```txt
Adaptador de LAN inalambrica Wi-Fi
Direccion IPv4
```

Ejemplo:

```txt
192.168.2.55
```

Entonces mobile debe usar:

```env
EXPO_PUBLIC_API_URL=http://192.168.2.55:4000
```

## Valores publicos vs secretos

Publicos:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Secretos:

- `OPENAI_API_KEY`
- `USDA_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- passwords de base de datos
- connection strings de PostgreSQL

## Reiniciar despues de cambiar .env

Cada vez que cambies `.env`, reinicia:

```bat
Ctrl + C
```

Luego:

```bat
npx pnpm@11.3.0 dev:api
```

Y para mobile:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
node --use-system-ca ../../node_modules/expo/bin/cli start --clear
```
