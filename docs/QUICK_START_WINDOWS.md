# Guia rapida Windows

Esta guia esta escrita paso a paso para correr FitFamily AI en tu PC y abrirla en tu celular con Expo Go.

## 1. Abrir CMD

Abre `Simbolo del sistema` o `CMD`.

No ejecutes comandos desde `U:\` si no estas dentro del proyecto. Primero entra a la carpeta correcta:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai"
```

Para confirmar que estas bien ubicado:

```bat
dir
```

Debes ver archivos como:

```txt
package.json
pnpm-workspace.yaml
apps
docs
supabase
```

## 2. Instalar dependencias

Desde la raiz:

```bat
npx pnpm@11.3.0 install
```

Si ya lo hiciste antes, no es necesario repetirlo cada vez.

## 3. Levantar backend

En la primera terminal:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai"
npx pnpm@11.3.0 dev:api
```

Debe aparecer algo parecido a:

```txt
FitFamily AI API listening on http://localhost:4000
```

Prueba en otra terminal:

```bat
curl http://localhost:4000/health
```

Respuesta esperada:

```json
{"ok":true,"service":"fitfamily-ai-api"}
```

## 4. Levantar app mobile

Abre una segunda terminal:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
node --use-system-ca ../../node_modules/expo/bin/cli start --clear
```

Expo mostrara un QR.

Si dice:

```txt
Port 8081 is being used by another process
Use port 8082 instead?
```

Responde:

```txt
Y
```

## 5. Abrir en celular

1. Instala o actualiza Expo Go desde Play Store.
2. El celular y el PC deben estar en la misma red Wi-Fi.
3. Abre Expo Go.
4. Escanea el QR.
5. Espera a que termine `Bundling`.

## 6. Login

Puedes crear una cuenta desde la app. Si Supabase tiene confirmacion de email activa, debes confirmar el correo antes de iniciar sesion.

Despues del login correcto, la app abre la pantalla de perfiles. Si no tienes perfiles, crea el primero.

## 7. Cerrar servidores

Para detener backend o Expo:

```txt
Ctrl + C
```

Hazlo en cada terminal que este corriendo un proceso.

## 8. Comandos de revision

Desde la raiz:

```bat
npx pnpm@11.3.0 typecheck
npx pnpm@11.3.0 lint
npx pnpm@11.3.0 test
```

Estos comandos ayudan a revisar que el codigo esta sano.
