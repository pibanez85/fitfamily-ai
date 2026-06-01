# Referencia API

Base local:

```txt
http://localhost:4000
```

Desde celular en Expo Go:

```txt
http://IP-DEL-PC:4000
```

Ejemplo:

```txt
http://192.168.2.55:4000
```

## Autenticacion

Todas las rutas privadas requieren:

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

El token lo obtiene mobile con Supabase Auth y lo envia al backend.

## Formato de respuesta

Exito normal:

```json
{
  "data": {}
}
```

Error:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje seguro para el cliente"
  }
}
```

## Health

```http
GET /health
```

Respuesta:

```json
{
  "ok": true,
  "service": "fitfamily-ai-api",
  "timestamp": "2026-05-27T00:00:00.000Z"
}
```

## Profiles

```http
GET /profiles
POST /profiles
GET /profiles/:profileId
PATCH /profiles/:profileId
DELETE /profiles/:profileId
```

Crear perfil:

```json
{
  "displayName": "Yayi",
  "birthdate": "2010-01-01",
  "sex": "femenino",
  "heightCm": 160,
  "goal": "Ganar fuerza",
  "activityLevel": "intermedio",
  "dietaryPreferences": {
    "notes": "Prefiere comidas simples"
  },
  "trainingPreferences": {
    "daysPerWeek": 3
  }
}
```

## Exercises

```http
GET /exercises
POST /exercises
GET /exercises/:exerciseId
```

Crear ejercicio:

```json
{
  "name": "Sentadilla",
  "category": "fuerza",
  "primaryMuscles": ["cuadriceps", "gluteos"],
  "secondaryMuscles": ["core"],
  "equipment": "barra",
  "instructions": "Baja con control y sube manteniendo el torso firme.",
  "safetyNotes": "Evitar dolor lumbar o rodillas colapsando."
}
```

## Workouts

```http
GET /profiles/:profileId/workouts
POST /profiles/:profileId/workouts
GET /workouts/:workoutId
PATCH /workouts/:workoutId
DELETE /workouts/:workoutId
```

Crear rutina:

```json
{
  "name": "Full body familiar",
  "description": "Rutina simple de cuerpo completo",
  "goal": "fuerza",
  "days": [
    {
      "dayIndex": 0,
      "name": "Dia A",
      "notes": "Calentar 8 minutos",
      "exercises": [
        {
          "exerciseId": "uuid-del-ejercicio",
          "orderIndex": 0,
          "targetSets": 3,
          "targetReps": "8-10",
          "restSeconds": 90
        }
      ]
    }
  ]
}
```

## Workout logs

```http
GET /profiles/:profileId/workout-logs
POST /profiles/:profileId/workout-logs
GET /workout-logs/:workoutLogId
PATCH /workout-logs/:workoutLogId
```

Crear registro:

```json
{
  "workoutId": null,
  "workoutDayId": null,
  "startedAt": "2026-05-27T12:00:00.000Z",
  "endedAt": "2026-05-27T13:00:00.000Z",
  "perceivedEffort": 7,
  "notes": "Buen entrenamiento",
  "sets": [
    {
      "exerciseId": "uuid-del-ejercicio",
      "setIndex": 1,
      "reps": 10,
      "weight": 40,
      "rpe": 8,
      "restSeconds": 90,
      "notes": "Tecnica estable"
    }
  ]
}
```

## Meals

```http
GET /profiles/:profileId/meals
POST /profiles/:profileId/meals
GET /meals/:mealId
PATCH /meals/:mealId
DELETE /meals/:mealId
```

Crear comida:

```json
{
  "mealType": "lunch",
  "eatenAt": "2026-05-27T14:00:00.000Z",
  "name": "Pollo con arroz",
  "calories": 650,
  "proteinG": 42,
  "carbsG": 72,
  "fatG": 18,
  "fiberG": 5,
  "notes": "Porcion estimada",
  "items": [
    {
      "name": "Pechuga de pollo",
      "estimatedPortion": "150 g",
      "calories": 248,
      "proteinG": 46,
      "carbsG": 0,
      "fatG": 5,
      "fiberG": 0,
      "confidence": 0.9
    }
  ]
}
```

## Foods

```http
GET /foods/search?query=marraqueta&includeExternal=true&limit=18
GET /foods/barcode/:barcode
```

`/foods/search` consulta la base chilena local y, si `includeExternal=true`, tambien intenta Open Food Facts y USDA desde backend.

Respuesta:

```json
{
  "query": "marraqueta",
  "results": [
    {
      "id": "marraqueta",
      "source": "local",
      "name": "Pan marraqueta",
      "servingLabel": "1 marraqueta",
      "servingG": 100,
      "caloriesPer100g": 270,
      "proteinPer100g": 8.5,
      "carbsPer100g": 55,
      "fatPer100g": 1.5,
      "fiberPer100g": 2.7,
      "isEstimated": true
    }
  ],
  "sources": ["local"],
  "cached": false
}
```

## Body metrics

```http
GET /profiles/:profileId/body-metrics
POST /profiles/:profileId/body-metrics
```

Crear metrica:

```json
{
  "measuredAt": "2026-05-27T08:00:00.000Z",
  "weightKg": 72.5,
  "bodyFatPercentage": null,
  "waistCm": 82,
  "chestCm": null,
  "hipCm": null,
  "armCm": null,
  "thighCm": null,
  "notes": "Medicion en ayunas"
}
```

## AI food analysis

```http
POST /profiles/:profileId/ai/analyze-food-photo
```

Request:

```json
{
  "imageUrl": "https://signed-url-temporal",
  "notes": "Plato de almuerzo, parece pollo con arroz"
}
```

Response:

```json
{
  "analysisId": "uuid",
  "estimatedMealName": "Pollo con arroz",
  "items": [],
  "totals": {
    "calories": 650,
    "proteinG": 42,
    "carbsG": 72,
    "fatG": 18,
    "fiberG": 5
  },
  "confidence": 0.74,
  "disclaimer": "Los nutrientes son estimaciones y deben corregirse manualmente."
}
```

## AI gym machine analysis

```http
POST /profiles/:profileId/ai/analyze-gym-machine-photo
```

Request:

```json
{
  "imageUrl": "https://signed-url-temporal",
  "notes": "Foto de maquina en el gimnasio"
}
```

Response:

```json
{
  "analysisId": "uuid",
  "machineName": "Prensa de piernas",
  "possibleExercises": ["Prensa de piernas"],
  "primaryMuscles": ["cuadriceps", "gluteos"],
  "secondaryMuscles": ["isquiotibiales"],
  "instructions": ["Ajusta el asiento", "Empuja sin bloquear rodillas"],
  "commonMistakes": ["Bloquear las rodillas", "Bajar demasiado sin control"],
  "safetyRecommendations": ["Usa rango comodo", "Detente si hay dolor"],
  "avoidIf": ["Dolor agudo de rodilla", "Lesion sin autorizacion profesional"],
  "difficulty": "beginner",
  "confidence": 0.8,
  "disclaimer": "No reemplaza a un entrenador profesional."
}
```

## AI chat

```http
POST /profiles/:profileId/ai/chat
```

Request:

```json
{
  "threadId": "uuid-opcional",
  "message": "Que entreno hoy?"
}
```

Response:

```json
{
  "threadId": "uuid",
  "message": {
    "role": "assistant",
    "content": "Respuesta en espanol claro y practica."
  }
}
```

## Dashboard

```http
GET /profiles/:profileId/dashboard
```

Devuelve:

- entrenamientos ultimos 7 dias
- comidas ultimos 7 dias
- calorias promedio
- proteinas promedio
- ultimo peso
- progreso reciente por ejercicio
- alertas simples
