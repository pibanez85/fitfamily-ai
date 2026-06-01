# Configurar OpenAI

OpenAI se usa solo desde el backend:

```txt
apps/api
```

La app mobile nunca debe tener `OPENAI_API_KEY`.

## 1. Variables

Archivo:

```txt
apps/api/.env
```

Configura:

```env
OPENAI_API_KEY=sk-tu-key-real
AI_PROVIDER=openai
AI_MODEL_TEXT=gpt-5.4-mini
AI_MODEL_VISION=gpt-5.4-mini
```

Para desarrollar sin gastar:

```env
AI_PROVIDER=mock
```

## 2. Reiniciar backend

Despues de cambiar `.env`:

```bat
cd /d "C:\Users\pibanez\OneDrive - SRI\Documentos\Apps personal\fitfamily-ai"
npx pnpm@11.3.0 dev:api
```

## 3. Donde vive la integracion

```txt
apps/api/src/services/ai/OpenAIProvider.ts
apps/api/src/services/ai/MockProvider.ts
apps/api/src/services/ai/providerFactory.ts
apps/api/src/services/ai/prompts.ts
apps/api/src/services/ai/jsonSchemas.ts
apps/api/src/services/ai/parse.ts
apps/api/src/services/ai/types.ts
```

## 4. Proveedor actual

La API elige proveedor con:

```env
AI_PROVIDER=openai
```

o:

```env
AI_PROVIDER=mock
```

## 5. Modelos

Variables:

```env
AI_MODEL_TEXT=
AI_MODEL_VISION=
```

Recomendacion practica actual del proyecto:

- texto/chat: modelo rapido y economico
- vision/comida/maquinas: modelo con buena capacidad multimodal

El nombre exacto del modelo queda centralizado en `.env` para poder cambiarlo sin tocar muchas partes del codigo.

## 6. Analisis de comida

Ruta:

```http
POST /profiles/:profileId/ai/analyze-food-photo
```

La IA debe devolver JSON estructurado con:

- nombre estimado de comida
- items detectados
- calorias
- proteinas
- carbohidratos
- grasas
- fibra
- confianza
- disclaimer

La respuesta se valida con Zod antes de guardar.

## 7. Analisis de maquina

Ruta:

```http
POST /profiles/:profileId/ai/analyze-gym-machine-photo
```

La IA debe devolver:

- nombre de maquina
- ejercicios posibles
- musculos principales
- musculos secundarios
- instrucciones
- errores comunes
- recomendaciones de seguridad
- cuando evitar
- dificultad
- confianza
- disclaimer

## 8. Chat

Ruta:

```http
POST /profiles/:profileId/ai/chat
```

El chat usa contexto de los ultimos 30 dias:

- perfil
- objetivos
- entrenamientos
- comidas
- metricas corporales
- preferencias

Si no hay datos, debe decirlo.

## 9. Errores comunes

## OPENAI_KEY_MISSING

Significa que:

```env
AI_PROVIDER=openai
```

pero falta:

```env
OPENAI_API_KEY=
```

## Respuesta IA no valida

Puede ocurrir si el modelo devuelve texto no compatible con el schema. El backend intenta trabajar con JSON estructurado y valida con Zod. Si falla, responde error controlado.

## Certificado corporativo

En este proyecto el backend usa un launcher de desarrollo que fuerza:

```txt
NODE_OPTIONS=--use-system-ca
```

Esto ayuda cuando una red corporativa usa certificados propios.
