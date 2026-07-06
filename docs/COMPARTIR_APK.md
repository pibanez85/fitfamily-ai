# Generar y compartir el APK de FitFamily AI

Guía práctica para crear una nueva versión del APK privado y repartirla a la
familia. Refleja el proceso real usado desde este PC (red de SRI).

## Antes de empezar

- El APK es **solo para Android**. iPhone requiere otro camino (TestFlight +
  cuenta de desarrollador de Apple, de pago).
- La app usa **cuentas reales** (Supabase). Cada persona crea su propia cuenta
  con **"Crear cuenta"** la primera vez; no se comparte usuario/contraseña.
- El backend gratuito (Render + Supabase) **"duerme"** tras inactividad: el
  primer login del día tarda ~60 s. Es normal, los siguientes son rápidos.

## 1. Generar un build nuevo

Cada cambio en la app requiere un APK nuevo. Desde PowerShell:

```powershell
cd "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"

# IMPORTANTE (red de SRI): sin esto, EAS falla con
# "self-signed certificate in certificate chain".
$env:NODE_OPTIONS="--use-system-ca"

npx eas-cli@latest build --platform android --profile preview
```

- El perfil `preview` genera un **APK instalable directo** (no pasa por Google
  Play) que apunta a la API y Supabase de producción.
- El login de EAS queda guardado; normalmente no hay que volver a iniciar
  sesión. Si lo pide: `npx eas-cli@latest login` (con la misma variable puesta).
- Al terminar (~10-15 min en los servidores de Expo) entrega un **enlace** y un
  **QR** de descarga.

### Antes de compilar: subir la versión

Si ya repartiste un APK antes, sube `android.versionCode` en
[`apps/mobile/app.json`](../apps/mobile/app.json) (ej. de `4` a `5`), o Android
no dejará instalar la actualización sobre la versión anterior.

## 2. Compartir el APK

**Opción A — enlace de EAS (recomendada).** En
[expo.dev → tu proyecto → Builds](https://expo.dev/accounts/patoiba189/projects/fitfamily-ai/builds)
abre el build y comparte por WhatsApp el **enlace de descarga**. Cada persona lo
abre **desde su celular Android**, descarga el APK e instala (Android pedirá
permitir "instalar apps desconocidas" una vez).

**Opción B — enviar el archivo.** Descarga el `.apk` desde esa misma página y
envíalo por WhatsApp / Drive / correo.

## 3. Cambiar el icono (opcional)

Los iconos se generan desde un script reproducible:

```powershell
cd "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
node scripts/generate-icons.mjs
```

Edita el SVG dentro de
[`scripts/generate-icons.mjs`](../apps/mobile/scripts/generate-icons.mjs) para
cambiar el diseño, vuelve a correr el script y compila un build nuevo.

## Checklist rápido

- [ ] `EXPO_PUBLIC_API_URL` apunta a la URL pública HTTPS (no `localhost`).
- [ ] OpenAI tiene límite de gasto mensual configurado.
- [ ] `versionCode` subido si es una actualización.
- [ ] `$env:NODE_OPTIONS="--use-system-ca"` puesto antes del build (red SRI).
- [ ] Build `preview` terminado y probado en un Android real.
