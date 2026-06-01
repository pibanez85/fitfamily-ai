# Prompts IA

Los prompts viven en:

```txt
apps/api/src/services/ai/prompts.ts
```

Los schemas de salida viven en:

```txt
apps/api/src/services/ai/jsonSchemas.ts
packages/shared/src/schemas.ts
```

## Principios

La IA debe ser:

- clara
- honesta
- practica
- segura
- conservadora cuando no sabe
- explicita sobre estimaciones

La IA no debe:

- inventar datos
- diagnosticar
- recomendar dietas extremas
- reemplazar profesionales
- dar indicaciones peligrosas si hay dolor o lesion

## Comida por foto

Objetivo:

- analizar una imagen de comida
- identificar alimentos visibles
- estimar porciones
- estimar macros
- devolver JSON estricto

Campos esperados:

- `estimatedMealName`
- `items`
- `totals`
- `confidence`
- `disclaimer`

Reglas:

- si la imagen no es clara, bajar confianza
- si la porcion no es visible, bajar confianza
- si el plato tiene salsas o ingredientes ocultos, bajar confianza
- siempre indicar que es una estimacion
- invitar a corregir manualmente

## Maquina de gimnasio por foto

Objetivo:

- identificar la maquina si es posible
- listar ejercicios posibles
- explicar musculos trabajados
- dar instrucciones paso a paso
- indicar errores comunes
- dar recomendaciones de seguridad
- indicar cuando evitar

Campos esperados:

- `machineName`
- `possibleExercises`
- `primaryMuscles`
- `secondaryMuscles`
- `instructions`
- `commonMistakes`
- `safetyRecommendations`
- `avoidIf`
- `difficulty`
- `confidence`
- `disclaimer`

Reglas:

- si no esta seguro, decirlo
- no forzar identificacion
- priorizar seguridad
- recomendar entrenador ante dolor, lesion o condicion medica

## Chat IA

Objetivo:

- responder en espanol claro
- usar contexto real del perfil
- ayudar como entrenador, nutricionista general y asistente personal
- ser practico y honesto

Contexto usado:

- perfil
- objetivos
- preferencias
- entrenamientos recientes
- comidas recientes
- metricas corporales recientes
- instrucciones personales guardadas en la rutina
- ejercicio actual cuando la consulta ocurre durante un entrenamiento

Reglas:

- no inventar datos si no existen
- decir cuando falta informacion
- no dar diagnosticos medicos
- no promover extremos
- recomendar profesional ante sintomas preocupantes

## IA contextual en entrenamiento

Durante el registro de entrenamiento, mobile envia al chat:

- rutina actual
- dia actual
- objetivo
- instrucciones personales de IA guardadas en la rutina
- ejercicio actual
- musculos y equipo
- series, repeticiones y descanso planificado
- solicitud concreta del usuario

La respuesta debe diferenciar entre ajuste temporal y cambio permanente. La app solo aplica una sugerencia cuando el usuario toca un boton de confirmacion.

## Validacion

Comida y maquina usan salida estructurada y validacion Zod.

Si la IA responde mal:

1. backend intenta parsear/validar
2. si falla, responde error controlado
3. no guarda datos invalidos

## Mejoras futuras

- guardar ejemplos buenos y malos
- agregar evaluaciones automaticas
- activar AI Arena en desarrollo
- comparar proveedores
- medir latencia y calidad
- agregar prompts por edad y nivel de entrenamiento
