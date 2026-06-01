# Google Play para Android

Objetivo: publicar FitFamily AI en Android, primero como prueba cerrada o privada.

## 1. Costo

Google Play Console cobra una tarifa unica de registro de USD 25.

Fuente oficial:

https://support.google.com/googleplay/android-developer/answer/6112435

## 2. Crear cuenta

1. Entra a https://play.google.com/console
2. Usa una cuenta Google que quieras mantener a largo plazo.
3. Paga la tarifa unica.
4. Completa verificacion de identidad si Google la solicita.

## 3. Antes de subir la app

Necesitas:

- Nombre de app: `FitFamily AI`.
- Icono de app.
- Capturas de pantalla.
- Politica de privacidad.
- Declaracion de seguridad de datos.
- Clasificacion de contenido.
- AAB generado con EAS production.

## 4. Generar AAB

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai\apps\mobile"
npx eas-cli@latest build --platform android --profile production
```

El resultado sera un `.aab`, que es el formato correcto para Google Play.

## 5. Prueba cerrada recomendada

Para empezar no publiques abierto.

Usa:

```txt
Testing > Closed testing
```

Agrega solo tu correo o correos de familia/amigos.

Importante: si creas una cuenta personal nueva de desarrollador, Google indica que debes hacer una prueba cerrada con al menos 12 testers que permanezcan aceptados durante 14 dias continuos antes de pedir acceso a produccion.

Fuente oficial:

https://support.google.com/googleplay/android-developer/answer/14151465

## 6. Datos sensibles

La app maneja:

- Cuenta de usuario.
- Perfiles familiares.
- Entrenamientos.
- Comidas.
- Fotos de comidas.
- Fotos de maquinas.
- Datos corporales.
- Posibles datos de salud/relojes inteligentes.

Por eso Google Play pedira una declaracion de datos clara.

## 7. Politica de privacidad

Antes de publicar, crea una politica de privacidad simple que diga:

- Que datos recoge.
- Para que se usan.
- Que datos se envian a OpenAI para analisis.
- Que fotos se guardan en Supabase.
- Como solicitar eliminacion de datos.
- Contacto del responsable.

No publicar comercialmente sin revisar esta parte.

## 8. Primer flujo recomendado

1. Deploy API en Render.
2. Configurar EAS con la URL publica.
3. Crear APK `preview` y probar en tu celular.
4. Corregir errores.
5. Crear AAB `production`.
6. Subir a Closed Testing en Play Console.
7. Probar con tu cuenta.
8. Luego sumar familia/amigos.
