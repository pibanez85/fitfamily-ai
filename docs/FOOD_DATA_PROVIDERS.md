# Proveedores de datos de alimentos

## Arquitectura

La app usa una arquitectura hibrida:

1. `LocalFoodProvider`
2. `OpenFoodFactsProvider`
3. `USDAFoodProvider`
4. `AIFoodEstimateProvider`

Todos normalizan al mismo formato `FoodCatalogItem`, definido en `packages/shared/src/foodCatalog.ts`.

## LocalFoodProvider

Usa el catalogo chileno local. Es rapido, sin red y no requiere credenciales. Es la primera fuente porque cubre alimentos frecuentes del usuario chileno.

## Open Food Facts

Uso: productos envasados, busqueda por nombre y busqueda por codigo de barra desde backend.

Endpoints internos:

- `GET /foods/search?query=...&includeExternal=true`
- `GET /foods/barcode/:barcode`

Notas:

- No requiere API key.
- Debe usarse con `User-Agent` propio.
- Calidad y cobertura dependen de contribuciones de la comunidad.
- Los datos pueden venir incompletos; la UI muestra fuente y verificacion.

Referencia oficial: [Open Food Facts API](https://openfoodfacts.github.io/openfoodfacts-server/api/)

## USDA FoodData Central

Uso: alimentos genericos y datos nutricionales confiables por 100 g.

Variable:

```env
USDA_API_KEY=
```

Si no se configura, el provider no falla: simplemente devuelve resultados vacios.

Referencia oficial: [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide)

## IA

`AIFoodEstimateProvider` queda creado como provider interno, pero en este MVP no guarda alimentos automaticamente. La IA se usa desde foto de comida y chat. La siguiente iteracion puede crear alimento desde descripcion, convertir porciones chilenas a gramos y devolver `FoodCatalogItem` con `source=ai_estimate`.

Regla: todo resultado de IA debe mostrarse como estimado y pedir confirmacion antes de guardar.

## Cache

`FoodSearchService` tiene cache en memoria por 12 horas para evitar llamadas repetidas durante desarrollo.

Tambien existe migracion `supabase/migrations/002_food_items_cache.sql` para persistir resultados externos antes de produccion.
