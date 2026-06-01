# Frontend UX — Decisiones y estado actual

Este documento resume el rediseño UX/UI aplicado al MVP del frontend móvil
(`apps/mobile`). Se mantiene corto y vivo: cuando un flujo cambie de forma
material, actualiza la sección correspondiente.

## Sistema de diseño

### Tema
- `src/theme/colors.ts` define dos paletas con las **mismas claves**:
  `darkColors` (default) y `lightColors`. Cada paleta incluye `onPrimary` para
  asegurar contraste en botones llenos.
- `src/theme/theme.tsx` provee `ThemeProvider` + `useTheme()` con persistencia
  via `expo-secure-store` (con fallback silencioso en web).
- `_layout.tsx` envuelve la app con `SafeAreaProvider` + `ThemeProvider`.
- El export legacy `colors` apunta a `darkColors` para que cualquier archivo no
  migrado siga funcionando. Los componentes base y las pantallas tocadas en
  esta tanda ya consumen `useTheme()`. Las pantallas todavía no migradas
  funcionan correctamente en modo oscuro y se irán migrando por fase.
- Toggle de tema disponible en `app/settings.tsx`.

### Componentes base (en `src/components/`)
| Componente | Propósito |
| --- | --- |
| `Screen` | Wrapper de pantalla con `SafeArea`, `ScrollView`, `StatusBar` y `BottomNav` condicional. |
| `BottomNav` | Tabs inferiores: Inicio / Entreno / Comida / Coach / Ajustes. |
| `Card`, `Typography`, `BodyText`, `Title`, `Subtitle` | Primitivas tipográficas con tema dinámico. |
| `AppButton` | Botón con variantes `primary` / `secondary` / `danger` / `ghost`, ícono opcional, estado `loading`. |
| `FormField` | Input controlado con `react-hook-form`. |
| `ChoiceGroup` | Lista de chips/opciones seleccionables. |
| `DateOfBirthPicker` | **Nuevo.** Bottom-sheet con año (horizontal), mes (grid) y día (grid). Edad calculada en vivo. Sustituye al calendario mensual en perfil. |
| `DatePickerField` | Calendario mensual (sigue válido para fechas recientes, ej. fecha de comida). |
| `QuantitySelector` | **Nuevo.** Chips de unidad reales por alimento + stepper +/- + resumen humano y preview de macros. |
| `MetricPill` | Pill de métrica con tonos `primary` / `energy` / `neutral`. |
| `BrandHero` | Cabecera de login. |
| `LoadingState`, `EmptyState` | Estados base. Pendiente: `ErrorState`, `Toast`. |
| `AIHelperCard` | **Nuevo.** Tarjeta de asistencia IA contextual: chips de prompts, respuesta y acciones (`primary` / `secondary` / `ghost`). Nunca aplica cambios sin confirmación del usuario. |

Componentes pendientes (siguiente fase): `IconButton`, `SearchInput`,
`SegmentedControl` reutilizable (hoy hay versión específica en Settings),
`Select` / `MultiSelect`, `BottomSheetPicker` genérico, `Toast`, `ErrorState`,
`StatCard`, `ProgressCard`, `FloatingAIButton`.

## Flujos rediseñados

### Crear rutina (Tarea 5/6)
Ruta: `app/workouts/create.tsx`. Wizard en 4 pasos con indicador visual:
1. **Nombre + objetivo + duración** (chips para 7 objetivos y 5 duraciones,
   incluida "Permanente hasta que la cambies").
2. **Frecuencia + nombres de día** (2 a 6 días) con plantillas auto-sugeridas
   (Empuje/Tirón/Pierna, Full body A/B, etc.).
3. **Ejercicios por día**: búsqueda por nombre sobre `api.workouts.exercises()`,
   stepper de orden, series/reps/descanso/peso/RPE/notas inline.
4. **Revisar y guardar**: resumen + checkbox "Marcar como rutina activa".

Al guardar invoca `api.workouts.create(profileId, payload)` (POST que el backend
ya exponía). Si se marca como activa, se guarda en zustand
(`activeWorkoutByProfile`) y queda visible en `today` y `workouts/index`.

### Entreno del día (Tarea 16)
`app/today.tsx` lee la rutina activa del store, trae el detalle con
`api.workouts.detail(id)`, muestra selector de días en chips y los ejercicios
del día con CTA "Registrar entrenamiento". Incluye `AIHelperCard` con prompts
para adaptar (máquina no disponible, menos tiempo, dolor, progresión, etc.) y
botones de acción (`Aplicar solo hoy`, `Guardar como alternativa`, `Descartar`).
**Las acciones son orientativas en esta fase** — la persistencia real de
"modificación temporal" vs "cambio permanente" es siguiente paso.

### Lista de rutinas (workouts/index)
- CTA "Crear nueva rutina".
- Badge "Activa" + acción rápida "Marcar activa / Desactivar".
- Acciones secundarias: Registrar entreno, Historial, Progreso.

### Perfil (Tarea 4)
- `DateOfBirthPicker` reemplaza el calendario mensual.
- Validación de edad razonable (0-120) vía Zod refine.
- Chips para sexo, objetivo, nivel de actividad, dieta y estilo de entreno.

### Nueva comida (Tareas 7/9/10)
- Catálogo extendido (`src/data/foodCatalog.ts`) con campos `units`, `aliases`,
  `estimated`. Añadidos panes chilenos (marraqueta, hallulla, pan de molde),
  queso fresco, naranja, tomate, lechuga, ensalada chilena, garbanzos, carne
  molida, además de unidades reales por alimento.
- Búsqueda tolera tildes y aliases (`palta`/`aguacate`, `marraqueta`/`pan
  batido`/`pan frances`).
- Cada alimento agregado usa `QuantitySelector` con chips de unidad reales
  (huevo / lata / taza / cucharada / g / ml...). Resumen humano:
  *"2 huevos aprox. 100 g"*, *"1 marraqueta aprox. 100 g"*. Macros preview
  en vivo. Disclaimer cuando el alimento está marcado como `estimated`.
- Totales del día siguen calculándose en base a `grams` (fuente de verdad),
  por lo que `sumSelectedFoods` no cambia.

## Decisiones técnicas

- **No se agregaron librerías UI pesadas.** Calendarios, bottom sheets,
  steppers y chips se implementaron a mano con primitivas RN para mantener
  compatibilidad estricta con Expo Go y SDK 56 (`react-native-reanimated@4`,
  `react-native-worklets@0.8`).
- **Modo demo intacto.** `demoApi` recibió `workouts.create` para que el wizard
  funcione sin Supabase. Todo el flujo (crear rutina, marcar activa, ver en
  `today`) es jugable sin backend.
- **IA siempre por backend.** `AIHelperCard` es presentational; las pantallas
  llaman a `api.ai.chat` con el contexto serializado del módulo
  (`Rutina: X. Día: Y. Ejercicios: ...`).
- **Tema light/dark progresivo.** En vez de un big-bang, se migró la chrome
  base (Screen/Card/AppButton/Typography/StateViews/BottomNav/MetricPill/
  FormField/ChoiceGroup) y los componentes nuevos. Las pantallas todavía no
  migradas funcionan bien en oscuro y aceptan toggle sin romperse, pero
  pueden tener algunos acentos locales no temáticos.
- **No se tocó el backend.** `POST /profiles/:id/workouts` ya existía con
  todo lo necesario.

## Pendientes claros (priorizado)

1. **Edición de rutinas** (Tarea 5 puntos 10-14): UI de editar/duplicar/archivar.
   El backend `PATCH` actualiza solo metadatos; para días se haría delete+recreate
   o un nuevo endpoint dedicado.
2. **Registro de sets desde rutina activa** (Tarea 5 punto 16): hoy
   `workouts/log` sigue siendo el MVP de un ejercicio.
3. **Modificación temporal vs permanente**: persistir el resultado de
   "Aplicar solo hoy" / "Guardar como alternativa" del `AIHelperCard`.
4. **Filtros de búsqueda de ejercicios** por músculo / equipamiento /
   categoría (los campos ya existen en `ExerciseSchema`, sólo falta exponerlos
   por endpoint o ampliar `api.workouts.exercises`).
5. **Nutrición** (Fase C): favoritos, comidas frecuentes, copiar día, IA
   contextual, "crear alimento personalizado".
6. **Progreso** (Fase D): volumen semanal, PRs, rachas. Hoy es sólo conteo.
7. **Chat** (Fase D): chips de preguntas, contexto vinculable por módulo.
8. **Fotos** comida/máquina (Fase D): pantallas más profesionales y
   correcciones IA confirmadas.
9. **Migración a `useTheme` del resto de pantallas** para que el modo claro
   sea 100% consistente.
