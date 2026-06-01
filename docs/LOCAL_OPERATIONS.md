# Operacion local

## Levantar backend

Terminal 1:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai"
npx pnpm@11.3.0 dev:api
```

## Levantar mobile

Terminal 2:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
node --use-system-ca ../../node_modules/expo/bin/cli start --clear
```

## Revisar backend

```bat
curl http://localhost:4000/health
```

Desde celular, la URL debe usar IP del PC:

```txt
http://192.168.2.55:4000/health
```

## Cambiar IP local

Si tu IP cambia:

1. Ejecuta:

```bat
ipconfig
```

2. Edita:

```txt
apps/mobile/.env
```

3. Cambia:

```env
EXPO_PUBLIC_API_URL=http://NUEVA-IP:4000
```

4. Reinicia Expo con `--clear`.

## Ver procesos por puerto

PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 4000 -State Listen
```

## Detener procesos

En la terminal donde esta corriendo:

```txt
Ctrl + C
```

## Logs

Backend:

- se ven en la terminal de `dev:api`

Expo:

- se ven en la terminal de `expo start`

Celular:

- errores aparecen en Expo Go y tambien en terminal Metro

## Flujo recomendado diario

1. Abrir backend.
2. Revisar `/health`.
3. Abrir Expo.
4. Escanear QR.
5. Probar login.
6. Probar una accion simple como dashboard o comidas.
