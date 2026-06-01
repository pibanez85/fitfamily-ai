# UX de rutinas y entrenamiento

## Creacion de rutina

La pantalla `apps/mobile/app/workouts/create.tsx` permite agregar instrucciones personales para la IA.

Estas instrucciones se guardan dentro de `workouts.description` con el marcador:

```txt
Instrucciones personales para IA:
```

Se eligio este camino para no cambiar el contrato de API ni crear una migracion solo por este MVP. Cuando se pida una sugerencia de rutina, el texto se envia como contexto complementario.

Ejemplos de uso:

- ejercicios que gustan o no gustan
- maquinas disponibles
- dias y tiempo disponible
- molestias, lesiones o limitaciones
- nivel, energia e intensidad preferida

Si el texto menciona dolor, lesion o sintomas preocupantes, la IA debe responder con cautela y recomendar apoyo profesional.

## Mapa muscular

El componente `apps/mobile/src/components/MuscleMap.tsx` usa SVG propio y muestra dos vistas:

- posterior
- frontal

No copia assets externos. Esta preparado para evolucionar a un mapa muscular completamente interactivo por regiones.

Los chips de musculos se sincronizan con el mapa. Algunos grupos nuevos funcionan como alias de grupos existentes para mantener compatibilidad con rutinas previas:

- abdomen y oblicuos pueden filtrar ejercicios de core
- lumbar puede filtrar core o espalda
- trapecio puede filtrar espalda
- antebrazos puede filtrar biceps o espalda
- aductores puede filtrar cuadriceps o gluteos

## Registro de entrenamiento

La pantalla `apps/mobile/app/workouts/log.tsx` carga la rutina real, permite elegir el dia y genera una tarjeta por ejercicio.

Cada tarjeta incluye:

- nombre
- musculo principal y secundarios
- equipo
- series, repeticiones, peso, RPE y descanso
- notas por serie y por ejercicio
- boton de detalle
- boton de alternativa IA
- acciones rapidas IA
- marcar ejercicio como completado
- agregar o quitar series
- aplicar sugerencia solo por hoy
- guardar sugerencia como nota de rutina base

El cambio permanente actual se guarda como nota en la descripcion de la rutina. Todavia no reemplaza automaticamente filas de `workout_day_exercises`; para eso conviene agregar un endpoint especifico en una siguiente iteracion.

## Detalle de ejercicio

La pantalla `apps/mobile/app/exercises/[exerciseId].tsx` muestra:

- nombre y equipo
- ranking/score
- placeholder visual para GIF o animacion
- series sugeridas
- instrucciones
- errores comunes
- seguridad
- variantes
- alternativas
- musculos trabajados
- accion para preguntar a IA

Los GIFs reales deben cargarse en el futuro como `mediaUrl` o `gifUrl`, idealmente desde Supabase Storage o un CDN con licencias claras.

### Media temporal para pruebas

Para esta etapa pre-productiva se agrego `apps/mobile/src/services/exerciseMedia.ts`.

Ese archivo permite asociar algunos ejercicios principales con GIFs gratuitos de ExerciseDB Free / AscendAPI. Esta fuente queda marcada como:

- uso de prototipo
- no comercial
- con atribucion requerida
- no lista para produccion comercial

No se consulta la API gratuita en cada pantalla porque tiene limites estrictos y puede responder con rate limit. En vez de eso se usa una lista local pequena de GIFs conocidos. Antes de salir a produccion se debe reemplazar por:

- videos propios cargados en Supabase Storage
- o dataset/licencia comercial con derechos claros

El campo visual queda preparado para `mediaUrl`, `gifUrl` o assets locales.

## Cronometro de descanso

El cronometro permite:

- iniciar
- pausar
- reiniciar
- saltar
- usar presets
- configurar descanso base
- iniciar descanso desde cada serie

Al terminar:

- usa vibracion con React Native
- usa haptics con `expo-haptics`
- intenta notificacion local con sonido del sistema usando `expo-notifications`
- en web degrada a un beep con Web Audio cuando el navegador lo permite

Las notificaciones no bloquean el entrenamiento si el usuario no entrega permisos.
