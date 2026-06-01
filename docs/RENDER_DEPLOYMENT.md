# Deploy economico de la API en Render

Objetivo: publicar `apps/api` en una URL HTTPS para que la app Android instalada pueda conectarse sin depender de tu PC.

## Recomendacion inicial

Para uso privado, empieza con Render `Free`.

Ventajas:

- Costo mensual: USD 0 para probar.
- Entrega URL HTTPS.
- Despliegue desde GitHub.
- Sirve para una beta privada.

Limitacion:

- En plan free puede demorar al abrir si el servicio estuvo inactivo.

Si te molesta esa espera, sube a Render `Starter` de USD 7/mes. En la pagina oficial de Render, Web Services muestra `Free $0/month` y `Starter $7/month`. Fuente: https://render.com/pricing

## 1. Antes de empezar

Necesitas:

1. Cuenta en GitHub.
2. Repositorio `fitfamily-ai` subido a GitHub.
3. Cuenta en Render: https://render.com
4. Proyecto Supabase funcionando.
5. Clave OpenAI configurada con limite de gasto.

## 2. Archivo ya preparado

El repo incluye:

```txt
render.yaml
```

Este archivo le dice a Render:

- Cual servicio crear.
- Como instalar dependencias.
- Como compilar la API.
- Como iniciar el servidor.
- Que `/health` es el health check.

## 3. Crear servicio desde Render

1. Entra a https://dashboard.render.com
2. Selecciona `New +`.
3. Selecciona `Blueprint`.
4. Conecta GitHub si Render lo pide.
5. Elige el repo `fitfamily-ai`.
6. Render detectara `render.yaml`.
7. Crea el Blueprint.

## 4. Variables de entorno en Render

Render pedira completar las variables marcadas como secretas.

Agrega:

```txt
SUPABASE_URL=https://zjosjypxdyourotlidqf.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_publica
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_secreta
OPENAI_API_KEY=tu_openai_api_key
```

Opcional:

```txt
USDA_API_KEY=
```

Importante:

- `SUPABASE_SERVICE_ROLE_KEY` nunca va en mobile.
- `OPENAI_API_KEY` nunca va en mobile.
- Solo van en Render.

## 5. Deploy

Render ejecutara:

```bash
corepack enable
corepack prepare pnpm@11.3.0 --activate
pnpm install --frozen-lockfile
pnpm --filter @fitfamily-ai/api build
pnpm --filter @fitfamily-ai/api start
```

Cuando termine, Render entregara una URL parecida a:

```txt
https://fitfamily-ai-api.onrender.com
```

## 6. Probar API

Abre en el navegador:

```txt
https://fitfamily-ai-api.onrender.com/health
```

Debe responder:

```json
{
  "ok": true,
  "service": "fitfamily-ai-api"
}
```

## 7. Conectar Android a la API publica

En Expo/EAS, configura para `preview` y `production`:

```txt
EXPO_PUBLIC_API_URL=https://fitfamily-ai-api.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://zjosjypxdyourotlidqf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica
```

No uses:

```txt
http://192.168.x.x:4000
http://localhost:4000
```

Eso solo sirve en desarrollo.

## 8. Build Android privado

Para APK privado:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
npx eas-cli@latest build --platform android --profile preview
```

## 9. Build para Google Play

Para Google Play se usa AAB:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
npx eas-cli@latest build --platform android --profile production
```

El perfil `production` genera un archivo `.aab`.

## 10. Costos

Costos minimos aproximados:

- Render Free: USD 0/mes para probar.
- Render Starter: USD 7/mes si quieres menos espera.
- Supabase Free: USD 0/mes al inicio.
- OpenAI: pago por uso; pon limite bajo.
- Google Play Console: USD 25 una vez. Fuente oficial: https://support.google.com/googleplay/android-developer/answer/6112435

## 11. Cuando usar Railway

Railway tambien es buena opcion, pero su plan Hobby funciona como compromiso minimo mensual de USD 5. Fuente: https://docs.railway.com/pricing/understanding-your-bill

Para este proyecto, Render es mas simple para partir porque puedes probar con plan free y cambiar a Starter si lo necesitas.
