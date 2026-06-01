# Android privado: primera salida a produccion

Objetivo: instalar FitFamily AI en un Android real, solo para uso privado, sin publicar en Google Play.

La ruta recomendada es:

1. Dejar Supabase listo.
2. Publicar la API Express en un hosting HTTPS.
3. Configurar variables de entorno de EAS.
4. Generar un APK privado con EAS Build.
5. Instalar el APK en el celular.

## 1. Estado actual

La app movil no debe usar una IP local como:

```txt
http://192.168.x.x:4000
```

Esa IP solo funciona mientras el celular esta en la misma Wi-Fi y tu PC tiene `dev:api` abierto.

Para una APK privada real, `EXPO_PUBLIC_API_URL` debe apuntar a una URL publica HTTPS:

```txt
https://tu-api-publica.com
```

## 2. Supabase

Puedes usar el proyecto Supabase actual para esta beta privada.

Antes de usarla fuera de desarrollo, revisar:

- Migraciones aplicadas.
- RLS activo y probado.
- Buckets de imagenes privados o con URLs firmadas.
- No usar `SUPABASE_SERVICE_ROLE_KEY` en mobile.
- Backups antes de tocar datos reales.

## 3. API en hosting

La API se puede subir a un hosting economico para Node.js.

Comandos esperados en el hosting:

```bash
npx pnpm@11.3.0 install --frozen-lockfile
npx pnpm@11.3.0 --filter @fitfamily-ai/api build
node apps/api/dist/server.js
```

Variables necesarias en el hosting:

```txt
NODE_ENV=production
PORT=4000
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AI_PROVIDER=openai
OPENAI_API_KEY=...
AI_MODEL_TEXT=gpt-5.4-mini
AI_MODEL_VISION=gpt-5.4-mini
AI_ARENA_ENABLED=false
```

Prueba minima cuando este desplegado:

```txt
https://tu-api-publica.com/health
```

Debe responder algo como:

```json
{ "ok": true, "service": "fitfamily-ai-api" }
```

## 4. Variables de la app Android

En Expo/EAS configura estas variables para el ambiente `preview`:

```txt
EXPO_PUBLIC_API_URL=https://tu-api-publica.com
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica
```

No configurar claves privadas en la app movil.

## 5. Login en EAS

Desde Windows:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
npx eas-cli@latest login
```

Si el proyecto aun no esta inicializado en Expo:

```bat
npx eas-cli@latest init
```

## 6. Generar APK privado

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
npx eas-cli@latest build --platform android --profile preview
```

Cuando EAS pregunte por credenciales Android, aceptar que Expo genere una keystore nueva.

El perfil `preview` genera un APK instalable directamente en Android.

## 7. Instalar en Android

Cuando termine el build, EAS entrega un enlace.

Pasos:

1. Abre el enlace desde tu celular Android.
2. Descarga el APK.
3. Android puede pedir permiso para instalar apps desconocidas.
4. Autoriza solo para esta instalacion.
5. Instala FitFamily AI.

## 8. Actualizaciones

Por ahora, para cada cambio debes generar un APK nuevo:

```bat
npx eas-cli@latest build --platform android --profile preview
```

Mas adelante se puede agregar EAS Update para enviar cambios de JavaScript sin reinstalar APK, pero no conviene activarlo hasta estabilizar la primera beta.

## 9. Relojes inteligentes

En Expo Go el modulo de relojes usa datos demo/fallback.

Para leer datos reales de Health Connect en Android se necesita una build nativa con dependencias/configuracion adicional. Para la primera APK privada se puede dejar como modulo visual/demo y activar Health Connect real en una segunda fase.

## 10. Checklist antes de instalar

- [ ] API publica responde `/health`.
- [ ] `EXPO_PUBLIC_API_URL` no apunta a `localhost` ni `192.168`.
- [ ] OpenAI tiene limite de gasto mensual.
- [ ] Supabase tiene RLS revisado.
- [ ] Se probo registro/login.
- [ ] Se probo crear perfil.
- [ ] Se probo crear rutina.
- [ ] Se probo registrar entrenamiento.
- [ ] Se probo comida manual o por IA.
- [ ] APK se genero con perfil `preview`.
