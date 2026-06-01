# Integracion API nutricional

## Endpoints

Todos los endpoints estan detras de autenticacion Supabase JWT.

### Buscar alimentos

```http
GET /foods/search?query=huevo&includeExternal=true&limit=18
```

Respuesta:

```json
{
  "data": {
    "query": "huevo",
    "results": [],
    "sources": ["local"],
    "cached": false
  }
}
```

`includeExternal=false` limita la busqueda a la base local.

### Buscar por codigo de barra

```http
GET /foods/barcode/7800000000000
```

Actualmente consulta proveedores que soportan barcode, principalmente Open Food Facts.

## Variables de entorno backend

```env
OPEN_FOOD_FACTS_BASE_URL=https://world.openfoodfacts.org
OPEN_FOOD_FACTS_USER_AGENT=FitFamilyAI/0.1 (dev; contact: your-email@example.com)
USDA_API_KEY=
```

No poner estas variables en `apps/mobile/.env`, salvo las que comienzan con `EXPO_PUBLIC_`.

## Seguridad

- Mobile no llama APIs externas con keys.
- USDA key queda solo en backend.
- Open Food Facts tambien se llama desde backend para controlar errores, cache y cuotas.
- Las respuestas se normalizan antes de enviarse a mobile.
- Los datos nutricionales estimados se marcan con `isEstimated`.

## Como agregar un alimento local

Editar `packages/shared/src/foodCatalog.ts` y agregar un `localFood({ ... })` con nombre, aliases chilenos, categoria, porcion comun, gramos por porcion, macros por 100 g y unidades sugeridas.

Luego correr:

```bat
npx pnpm@11.3.0 typecheck
npx pnpm@11.3.0 test
```
