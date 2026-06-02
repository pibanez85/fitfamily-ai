# Seguridad

FitFamily AI maneja datos personales, fotos, salud, nutricion y entrenamiento. Por eso la seguridad debe tratarse como parte central del producto.

## Reglas principales

- Mobile nunca contiene `OPENAI_API_KEY`.
- Mobile nunca contiene `SUPABASE_SERVICE_ROLE_KEY`.
- Mobile nunca llama a OpenAI directamente.
- Backend valida JWT de Supabase en rutas privadas.
- Backend valida ownership antes de leer o escribir recursos.
- Zod valida inputs de API.
- Zod valida respuestas estructuradas de IA.
- Errores no deben filtrar secretos.
- Fotos se guardan en buckets privados.

## Variables publicas y privadas

Permitido en mobile:

```env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Solo backend:

```env
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Nunca subir:

- `.env`
- passwords de PostgreSQL
- connection strings
- screenshots con claves visibles

## JWT

El frontend inicia sesion con Supabase Auth y recibe un access token.

En cada llamada privada:

```http
Authorization: Bearer <access_token>
```

El backend valida el token en:

```txt
apps/api/src/middleware/auth.ts
apps/api/src/services/supabase.ts
```

## Recuperacion de clave

Mobile usa Supabase Auth para recuperar clave. La app no genera ni guarda claves.

URL de redireccion para Android/iOS:

```txt
fitfamilyai://reset-password
```

En Supabase debe agregarse en:

```txt
Authentication > URL Configuration > Redirect URLs
```

Si no se agrega, el correo puede llegar correctamente, pero el enlace no abrira la pantalla `reset-password` de la app.

## Ownership

Archivo:

```txt
apps/api/src/services/ownership.ts
```

Reglas:

- un usuario solo puede ver sus perfiles
- un perfil solo puede acceder a sus comidas, entrenamientos, metricas y chats
- si el recurso no pertenece al usuario, la API responde error

## RLS

La migracion activa RLS en las tablas principales.

Aunque el backend usa service role, RLS es importante porque:

- protege accesos directos futuros
- documenta reglas de seguridad en base de datos
- reduce riesgo si se agregan queries desde cliente

Antes de produccion:

- probar policies con usuarios reales de prueba
- revisar permisos de `authenticated`
- evitar permisos directos innecesarios

## Storage

Buckets privados:

```txt
meal-photos
machine-photos
progress-photos
```

Path esperado:

```txt
{userId}/{profileId}/{timestamp}.jpg
```

Pendiente antes de produccion:

- mover creacion de URLs firmadas al backend
- reducir expiracion si corresponde
- registrar auditoria de accesos a imagenes

## IA y salud

La IA debe:

- decir cuando no tiene suficiente informacion
- no inventar datos historicos
- marcar nutrientes como estimaciones
- recomendar correccion manual
- recomendar profesional ante dolor, lesion, sintomas preocupantes o condicion medica
- pedir confirmacion antes de aplicar cambios de rutina sugeridos por IA

La IA no debe:

- diagnosticar enfermedades
- recomendar dietas extremas
- reemplazar medico, nutricionista o entrenador
- generar instrucciones peligrosas

## Riesgos conocidos

## Notificaciones de descanso

El cronometro de descanso solicita permisos de notificacion local solo para avisar que termino el descanso. Si el usuario no da permiso, el entrenamiento sigue funcionando con feedback visual y vibracion/haptics cuando esten disponibles.

## Datos de salud

Peso, medidas, fotos y habitos alimentarios son datos sensibles. Para produccion se recomienda:

- politica de privacidad
- consentimiento claro
- exportacion y eliminacion de datos
- backups seguros

## Fotos

Fotos de comida, cuerpo o gimnasio pueden revelar informacion privada. Se recomienda:

- buckets privados
- URLs firmadas cortas
- eliminacion desde la app
- no guardar mas de lo necesario

## IA

La IA puede equivocarse. Se recomienda:

- mostrar disclaimers
- permitir edicion manual
- guardar confianza
- no automatizar decisiones de salud criticas

## Checklist minimo antes de produccion

- Rotar claves compartidas por error.
- Revisar `.gitignore`.
- Confirmar que no hay secretos en Git.
- Activar rate limit en API.
- Revisar CORS.
- Revisar RLS.
- Usar HTTPS en backend productivo.
- Configurar logs sin datos sensibles.
- Configurar backups Supabase.
