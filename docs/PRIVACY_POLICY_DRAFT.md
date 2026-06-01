# Borrador de politica de privacidad

Este documento es un borrador para la beta privada de FitFamily AI. Antes de una publicacion comercial abierta, debe revisarse legalmente.

## Responsable

FitFamily AI es una aplicacion privada de seguimiento de entrenamiento, nutricion y progreso personal.

Contacto:

```txt
pendiente@tu-email.com
```

## Datos que puede recopilar la app

La app puede almacenar:

- Correo de la cuenta.
- Perfiles familiares.
- Objetivos de entrenamiento y nutricion.
- Rutinas y entrenamientos registrados.
- Series, repeticiones, peso, descanso, RPE y notas.
- Comidas, alimentos y estimaciones nutricionales.
- Fotos de comidas.
- Fotos de maquinas de gimnasio.
- Peso corporal, medidas y fotos de progreso si el usuario las agrega.
- Datos de salud/reloj inteligente si el usuario concede permisos.
- Mensajes enviados al chat con IA.

## Uso de los datos

Los datos se usan para:

- Mostrar progreso de entrenamiento.
- Calcular indicadores nutricionales.
- Generar dashboards personales.
- Dar sugerencias de entrenamiento y nutricion.
- Analizar fotos de comidas o maquinas mediante IA.
- Responder preguntas del usuario con contexto de su historial.

## Servicios externos

La app usa:

- Supabase para autenticacion, base de datos y almacenamiento.
- OpenAI para funciones de inteligencia artificial.
- Hosting de API para procesar solicitudes de forma segura.

Las claves privadas de OpenAI y Supabase no se exponen en la app movil.

## Inteligencia artificial

Cuando el usuario usa funciones de IA, parte del contenido necesario puede enviarse a OpenAI, por ejemplo:

- Texto de la pregunta.
- Imagen de comida o maquina.
- Objetivos y datos recientes relevantes.

La IA entrega estimaciones y sugerencias. No reemplaza a medicos, nutricionistas ni entrenadores profesionales.

## Fotos

Las fotos subidas se almacenan en Supabase Storage. Para produccion se recomienda usar buckets privados y URLs firmadas.

## Datos de salud

Si el usuario conecta un reloj o servicio de salud, la app solo accede a los datos autorizados por el usuario. El usuario puede revocar permisos desde los ajustes del sistema.

## Eliminacion de datos

El usuario puede solicitar eliminacion de sus datos contactando a:

```txt
pendiente@tu-email.com
```

## Seguridad

La app usa autenticacion con Supabase y valida el acceso a perfiles familiares desde el backend.

## Cambios

Esta politica puede cambiar conforme evolucione la app.
