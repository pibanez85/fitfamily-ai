# Modulo de nutricion

## Estado del MVP

El modulo de nutricion ahora funciona como una primera version de tracking moderno:

- Dashboard diario con calorias consumidas, macros y calorias restantes.
- Donut de macros y barras de progreso.
- Resumen por desayuno, almuerzo, cena y snacks.
- Graficos simples de calorias y proteina semanal.
- Flujo de agregar comida con busqueda, porciones humanas y confirmacion.
- Base local chilena compartida entre mobile y backend, con mas de 190 alimentos iniciales.
- Busqueda backend preparada para Open Food Facts y USDA FoodData Central.
- Foto de comida con IA se mantiene como flujo separado.

## Pantallas

`apps/mobile/app/meals/index.tsx`

Pantalla principal tipo nutrition dashboard. Calcula los totales del dia desde las comidas guardadas y muestra calorias, macros, comidas agrupadas, accesos rapidos y resumen semanal.

`apps/mobile/app/meals/new.tsx`

Flujo para agregar comida:

1. elegir tipo de comida
2. buscar alimento
3. seleccionar alimento
4. ajustar cantidad/unidad
5. revisar macros
6. guardar

La busqueda usa debounce y primero muestra sugerencias limitadas. No se renderiza la base completa al entrar. Si hay backend real, consulta `/foods/search` para traer tambien proveedores externos.

## Catalogo chileno

El catalogo vive en `packages/shared/src/foodCatalog.ts`.

Incluye alimentos frecuentes de Chile como huevo, marraqueta, hallulla, arroz, fideos, papa, pechuga de pollo, atun, jurel, leche, yogur, quesillo, palta, frutas, legumbres, aceite, empanada, cazuela, completo, churrasco y charquican.

Cada alimento tiene fuente, aliases, categoria, porciones sugeridas, gramos equivalentes, macros por 100 g e indicador verificado/estimado.

## Limitaciones actuales

- No hay scanner de codigo de barra con camara todavia.
- El cache de proveedores externos esta implementado en memoria y hay migracion preparada para persistirlo.
- USDA requiere `USDA_API_KEY`.
- Las metas nutricionales todavia son referenciales.
- La edicion manual fina de macros por item queda como siguiente paso.

## Como probar

```bat
npx pnpm@11.3.0 dev:api
npx pnpm@11.3.0 dev:mobile
```

En la app: `Comida` -> `Agregar comida` -> buscar `huevo`, `marraqueta`, `atun` o `arroz` -> ajustar cantidad -> guardar.
