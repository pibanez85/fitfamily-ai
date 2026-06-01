# FitFamily AI

FitFamily AI es una app mobile familiar para registrar entrenamiento, comidas, progreso fisico, fotos e interacciones con IA. Esta pensada inicialmente para uso familiar, pero con una base tecnica real para crecer a producto.

## Que incluye este MVP

- App Expo para Android, iPhone y web.
- Login y registro con Supabase Auth.
- Perfiles familiares y perfil activo.
- Dashboard semanal.
- Rutinas, entrenamiento del dia, historial y progreso.
- Constructor de rutinas con instrucciones personales para IA.
- Mapa muscular frontal/posterior para filtrar ejercicios.
- Registro de entrenamiento con tarjetas por ejercicio, cronometro y asistencia IA.
- Detalle de ejercicio preparado para GIF/animaciones con placeholders.
- Registro de comidas manual con catalogo local de alimentos.
- Dashboard nutricional moderno con macros, resumen semanal y busqueda hibrida de alimentos.
- Base inicial chilena de alimentos frecuentes y endpoints backend para Open Food Facts/USDA.
- Foto de comida con analisis IA multimodal.
- Foto de maquina de gimnasio con analisis IA multimodal.
- Chat IA con contexto de perfil, comidas, entrenamientos y metricas.
- Backend Express seguro con validacion JWT de Supabase.
- Migraciones SQL y seed inicial de ejercicios.
- Proveedor IA desacoplado: OpenAI y Mock.
- Documentacion de instalacion, seguridad, Supabase, OpenAI, pruebas y produccion.

## Stack

- Mobile: React Native, Expo 56, Expo Router, TypeScript, Zustand, React Hook Form, Zod, Expo Image Picker, Expo SecureStore.
- Feedback de entrenamiento: Expo Haptics y Expo Notifications para avisos de descanso.
- API: Node.js, Express 5, TypeScript, Zod, Supabase JS, OpenAI SDK.
- Base de datos: PostgreSQL en Supabase.
- Storage: Supabase Storage.
- Monorepo: pnpm workspaces.

Usamos `pnpm` porque maneja monorepos de forma simple y rapida. Si no lo tienes instalado globalmente, puedes ejecutar los comandos con `npx pnpm@11.3.0`.

## Estructura

```txt
fitfamily-ai/
  apps/
    mobile/          App Expo
    api/             API Express
  packages/
    shared/          Tipos y esquemas Zod compartidos
  supabase/
    migrations/      SQL versionado
    seed/            Datos iniciales
  docs/              Documentacion del proyecto
```

## Empezar rapido en Windows

Desde CMD:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai"
npx pnpm@11.3.0 install
npx pnpm@11.3.0 dev:api
```

En otra terminal CMD:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
node --use-system-ca ../../node_modules/expo/bin/cli start --clear
```

Luego abre Expo Go en el celular y escanea el QR.

Si Expo pregunta `Use port 8082 instead?`, responde `Y`.

## Variables de entorno

Hay archivos de ejemplo en:

- `.env.example`
- `apps/api/.env.example`
- `apps/mobile/.env.example`

Regla importante:

- `apps/mobile/.env` solo puede tener variables publicas `EXPO_PUBLIC_*`.
- `apps/api/.env` contiene secretos del servidor como `OPENAI_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
- Nunca pongas `OPENAI_API_KEY` en mobile.

## Comandos principales

Desde la raiz del proyecto:

```bat
npx pnpm@11.3.0 dev:api
npx pnpm@11.3.0 dev:mobile
npx pnpm@11.3.0 typecheck
npx pnpm@11.3.0 lint
npx pnpm@11.3.0 test
npx pnpm@11.3.0 build
```

Health del backend:

```bat
curl http://localhost:4000/health
```

## Documentacion completa

Lee primero:

- [Indice de documentacion](docs/INDEX.md)
- [Guia rapida para correr la app](docs/QUICK_START_WINDOWS.md)
- [Variables de entorno](docs/ENVIRONMENT.md)
- [Configurar Supabase](docs/SUPABASE_SETUP.md)
- [Configurar OpenAI](docs/OPENAI_SETUP.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Referencia API](docs/API_REFERENCE.md)
- [Modelo de datos](docs/DATA_MODEL.md)
- [Guia mobile](docs/MOBILE_GUIDE.md)
- [Seguridad](docs/SECURITY.md)
- [Prompts IA](docs/AI_PROMPTS.md)
- [AI Arena](docs/AI_ARENA.md)
- [UX de rutinas y entrenamiento](docs/WORKOUT_UX.md)
- [Modulo de nutricion](docs/NUTRITION_MODULE.md)
- [Proveedores de alimentos](docs/FOOD_DATA_PROVIDERS.md)
- [Integracion API nutricional](docs/NUTRITION_API_INTEGRATION.md)
- [Pruebas y calidad](docs/TESTING.md)
- [Solucion de problemas](docs/TROUBLESHOOTING.md)
- [Checklist para produccion](docs/PRODUCTION_CHECKLIST.md)
- [Operacion local](docs/LOCAL_OPERATIONS.md)

## Estado actual

Verificado localmente:

- `npx pnpm@11.3.0 typecheck`
- `npx pnpm@11.3.0 lint`
- `npx pnpm@11.3.0 test`
- Backend `/health`
- Login Supabase contra backend con token real

Pendientes antes de produccion:

- Revisar RLS y policies con tests de Supabase.
- Mover firmado de URLs de Storage al backend.
- Agregar rate limiting en endpoints IA.
- Crear build nativo de Expo/EAS.
- Agregar monitoreo y logs productivos.
- Ampliar catalogo nutricional con fuente confiable.
