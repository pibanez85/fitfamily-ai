# Abrir FitFamily en Windows, web y Expo Go

Esta guía distingue la app de demostración del backend real. El modo demo no usa Supabase ni OpenAI y no modifica archivos `.env`.

## 1. Probar la experiencia sin configurar servicios

Desde PowerShell, en la raíz del proyecto:

```powershell
pnpm --filter @fitfamily-ai/mobile dev:demo --lan
```

El comando equivale a `node apps/mobile/scripts/start-demo.mjs --lan`. El script fuerza `EXPO_PUBLIC_DEMO_MODE=true`, omite la carga de `.env` y abre Metro con caché limpia. Los registros demo quedan en el dispositivo/navegador. La IA no es real en este modo.

Para probar en el computador:

```powershell
node apps/mobile/scripts/start-demo.mjs --web --port 8086 --localhost
```

Abre [la vista local](http://localhost:8086). `--localhost` es solo para el computador: para el teléfono usa `--lan`.

## 2. Comprobar Expo Go antes de escanear

Este proyecto declara **Expo SDK 56**. La versión de Expo Go del teléfono debe ser compatible con SDK 56.

**Diagnóstico confirmado el 16 de septiembre de 2026:** la Expo Go que se descarga hoy desde Google Play / App Store sigue publicada para **SDK 54** (Expo quedó atrasado en subir versiones nuevas a las tiendas por demoras de aprobación; ver [changelog de Expo, mayo 2026](https://expo.dev/changelog/expo-go-and-app-store-may-2026) y [changelog SDK 57](https://expo.dev/changelog/sdk-57)). Es decir, el problema no es que Expo Go esté "más adelante" que el proyecto, sino atrás: SDK 56 quedó fuera de lo que la app de la tienda soporta. Actualizar Expo Go desde la tienda no corrige esto porque la tienda no tiene una versión más nueva disponible.

### Solución elegida para este proyecto: instalar el APK de Expo Go para SDK 56 (Android)

Sin tocar el código del proyecto, se puede instalar manualmente (sideload) la build de Expo Go que sí corresponde a SDK 56:

1. **Desinstala Expo Go de Play Store primero.** Android no permite tener dos apps con el mismo paquete (`host.exp.exponent`) si tienen firmas distintas, así que si no la desinstalas la instalación del APK sideloaded falla.
2. En el teléfono, habilita "Instalar apps desconocidas" para el navegador o la app de Archivos que uses (Ajustes → Apps → acceso especial).
3. Abre en el navegador del teléfono: [`expo.dev/go?sdkVersion=56&platform=android&device=true`](https://expo.dev/go?sdkVersion=56&platform=android&device=true). Esa página da el APK exacto para SDK 56 en dispositivo físico Android (no emulador), actualmente `Expo-Go-56.0.4.apk` desde el repositorio oficial `expo/expo-go-releases`.
4. Descarga e instala ese APK.
5. Vuelve a escanear el QR del servidor (`pnpm --filter @fitfamily-ai/mobile dev:demo --lan`, o `expo start --go --lan` para datos reales).

Esto solo funciona en **Android**. En iPhone no existe un sideload equivalente sin usar TestFlight o un development build (EAS), porque iOS no permite instalar IPAs sueltos fuera de esos canales.

**Nota de Expo:** su documentación de troubleshooting confirma que expo.dev/go es el método soportado para instalar la build que corresponde al SDK del proyecto, pero también recomienda a mediano plazo migrar a un *development build* (`expo-dev-client` + EAS Build) para no depender de qué SDK tenga Expo Go en la tienda en cada momento. Es una opción a evaluar más adelante si este desfase se repite con cada SDK nuevo, pero no es necesaria para desbloquear la conexión ahora.

El teléfono y Windows deben estar en la misma Wi-Fi. Permite Node.js en el firewall para la red privada y evita redes de invitados que aíslan los dispositivos. Escanea el QR del servidor que acabas de iniciar. [Inicio oficial de Expo](https://docs.expo.dev/get-started/start-developing/).

Si la red impide la conexión LAN, prueba:

```powershell
node apps/mobile/scripts/start-demo.mjs --tunnel
```

Tunnel requiere internet y el soporte de `@expo/ngrok`; Expo puede solicitar su instalación. Es más lento y solo comunica el servidor de Expo, no la API de FitFamily. [Documentación de Tunnel](https://docs.expo.dev/more/expo-cli/#tunneling).

## 3. Conectar datos reales

Para usar tu cuenta y datos reales, inicia la API desde otra terminal en la raíz:

```powershell
pnpm dev:api
```

En Windows, ejecuta `ipconfig` y busca la IPv4 de tu conexión Wi-Fi, por ejemplo `192.168.1.50`. En `apps/mobile/.env`, `EXPO_PUBLIC_API_URL` debe apuntar a esa dirección:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.50:4000
```

Conserva las variables públicas Supabase que ya tiene el proyecto. Reinicia Metro después de cambiar variables. No uses `localhost` en la URL de API del teléfono: allí significa el propio teléfono, no Windows.

Prueba desde el navegador del teléfono `http://192.168.1.50:4000/health`. Si no responde, resuelve la red/firewall antes del login. Usar Tunnel para Expo no hace accesible automáticamente esta API; para datos reales fuera de tu Wi-Fi hace falta una API HTTPS alcanzable.

Inicia la app real desde `apps/mobile`:

```powershell
node --use-system-ca ../../node_modules/expo/bin/cli start --go --lan --clear
```

No uses `dev:demo` para esta prueba: siempre mantiene los datos simulados.

## 4. Cambios que no aparecen

Cierra el servidor anterior con Ctrl+C, vuelve a iniciar y abre el puerto/QR nuevo. Si tienes `CI=true` en la terminal de desarrollo, quítalo antes:

```powershell
Remove-Item Env:CI -ErrorAction SilentlyContinue
```

No mezcles una pestaña en 8085 con el servidor nuevo en 8086. Recarga la página o Expo Go. `--clear` ya está incluido en `dev:demo`.

## Verificación realizada el 16 de septiembre de 2026

- Servidor demo web iniciado en 8086, con seguimiento de cambios activo.
- Se reprodujo un fallo de OneDrive/Windows: `readdir` clasificaba algunos archivos normales como enlaces, mientras `lstat` los reconocía correctamente. Metro perdía archivos existentes como `expo-router/build/primitives/types.js` y `zod/v4/core/index.cjs`. `scripts/windows-file-types.cjs` normaliza únicamente esos casos dentro del proyecto y conserva los enlaces reales. El diagnóstico de Metro pasó de `exists: false` a `exists: true` para ambos archivos. La configuración por defecto del sistema de archivos bajo demanda de Expo se mantiene.
- Se retiró la configuración manual de Metro que reemplazaba las carpetas del monorepo. Se usa `getDefaultConfig` de Expo y se limpia la caché al iniciar, siguiendo la [guía oficial de monorepos para SDK 52+](https://docs.expo.dev/guides/monorepos/).
- La revisión detectó dos diferencias con `expo/bundledNativeModules.json`. Se instalaron `react-native-safe-area-context` 5.7.0 (declarado `~5.7.0`) y `react-native-svg` 15.15.4 (versión fijada), de acuerdo con el SDK 56 instalado.
- `expo install --check` con `EXPO_OFFLINE=1` terminó con «Dependencies are up to date». Expo advierte que la verificación offline es menos fiable que la conectada. También se compararon las versiones con el SDK instalado. La comprobación conectada quedó pendiente por una restricción del entorno; no se migró el proyecto a otro SDK.
- No se probó en un teléfono físico. Cámara, permisos, avisos y comportamiento en segundo plano deben comprobarse en el dispositivo. Las integraciones nativas de salud pueden requerir una compilación propia.

Para repetir la comprobación sin cambiar paquetes, desde `apps/mobile`:

```powershell
$env:CI='1'
node --use-system-ca ../../node_modules/expo/bin/cli install --check
Remove-Item Env:CI
```
