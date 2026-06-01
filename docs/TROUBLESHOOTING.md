# Solucion de problemas

## Error: No package.json found in U:\

Significa que ejecutaste `pnpm` fuera de la carpeta del proyecto.

Solucion:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai"
npx pnpm@11.3.0 dev:api
```

## Expo pregunta por otro puerto

Mensaje:

```txt
Port 8081 is being used by another process
Use port 8082 instead?
```

Solucion:

```txt
Y
```

## Expo Go dice proyecto incompatible

Mensaje:

```txt
Project is incompatible with this version of Expo Go
```

Solucion:

1. Actualiza Expo Go desde Play Store o App Store.
2. Cierra Expo Go.
3. Reinicia Metro:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
node --use-system-ca ../../node_modules/expo/bin/cli start --clear
```

## La app funciona en web pero no en celular

Revisa:

1. PC y celular en la misma Wi-Fi.
2. `apps/mobile/.env` usa IP del PC, no `localhost`.
3. Backend corre en `0.0.0.0` o es accesible desde la red local.
4. Firewall no bloquea puerto 4000.

Prueba:

```bat
curl http://192.168.2.55:4000/health
```

Cambia `192.168.2.55` por tu IP real.

## Login queda en la misma pantalla

Causas comunes:

- email no confirmado
- clave incorrecta
- backend no esta corriendo
- token no puede validarse contra Supabase
- celular no puede llegar a `EXPO_PUBLIC_API_URL`

Solucion:

1. Levanta API:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai"
npx pnpm@11.3.0 dev:api
```

2. Verifica health:

```bat
curl http://localhost:4000/health
```

3. Verifica IP del PC:

```bat
ipconfig
```

4. Revisa `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://TU-IP:4000
```

5. Reinicia Expo con cache limpio.

## Error: Invalid or expired Supabase token

Puede pasar si:

- cambiaste claves de Supabase
- la sesion quedo antigua en Expo Go
- backend no puede validar token por certificado de red

Solucion:

1. Cierra Expo Go.
2. Reinicia backend.
3. Reinicia Expo con `--clear`.
4. Inicia sesion nuevamente.

El backend usa `apps/api/scripts/dev.mjs` para forzar `NODE_OPTIONS=--use-system-ca` en desarrollo.

## Error: self-signed certificate in certificate chain

Suele ocurrir en redes corporativas.

El proyecto ya incluye:

```txt
--use-system-ca
NODE_OPTIONS=--use-system-ca
```

Si aparece de nuevo:

1. Reinicia backend con `npx pnpm@11.3.0 dev:api`.
2. Revisa que no tengas un backend viejo corriendo en puerto 4000.

Ver proceso del puerto:

```powershell
Get-NetTCPConnection -LocalPort 4000 -State Listen
```

## Error TreeFS de Expo o Metro

Mensaje parecido:

```txt
TreeFS: Failed to make parent directory entry
```

Solucion:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
node --use-system-ca ../../node_modules/expo/bin/cli start --clear
```

Si sigue:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai"
npx pnpm@11.3.0 install
```

## React version mismatch

Mensaje:

```txt
Incompatible React versions
```

Solucion:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai"
npx pnpm@11.3.0 install
cd apps\mobile
node --use-system-ca ../../node_modules/expo/bin/cli start --clear
```

## Intentaste abrir .env como comando

Ejemplo incorrecto:

```bat
C:\Users\...\apps\mobile\.env
```

Eso no se ejecuta. `.env` es un archivo de texto.

Para abrirlo puedes usar Bloc de notas:

```bat
notepad "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile\.env"
```
