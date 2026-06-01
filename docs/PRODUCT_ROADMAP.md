# Product Roadmap

Snapshot al cierre de la **Fase A + Fase B** del rediseño. Sirve para alinear
qué entra en la beta privada, qué bloquea producción y qué viene después.

## Beta privada (siguiente entrega)

- **Edición de rutinas** completa: editar nombre/objetivo/días/ejercicios,
  duplicar, archivar.
- **Registrar entreno desde rutina activa**: que `workouts/log` recoja el día
  seleccionado en `today` y permita registrar sets por ejercicio (no sólo el
  primero).
- **Persistencia "solo hoy" vs "rutina base"**: aplicar al historial vs
  modificar el `Workout` real cuando el usuario confirma.
- **Búsqueda de ejercicios por músculo y equipamiento** (el campo ya existe
  en el schema; exponerlo en `/exercises` y en `api.workouts.exercises`).
- **Nutrición — Fase C**:
  - Recientes / favoritos / comidas frecuentes (zustand + persistencia).
  - "Copiar comida de otro día" y "Repetir comida habitual".
  - Crear alimento personalizado (local primero, luego sincronizable).
  - `AIHelperCard` en nutrición con casos: faltan proteínas, sugerir cena,
    convertir 2 huevos y 1 marraqueta, etc.
  - Corrección manual de macros tras análisis por foto.
- **Dashboard moderno — Fase D**:
  - Saludo + resumen del día + entrenamiento de hoy + nutrición del día.
  - Alertas útiles ("no has registrado proteína hoy", "tienes rutina pendiente").
  - `FloatingAIButton` global.
- **Chat IA**: chips de sugerencias, contexto vinculado por módulo.
- **Fotos comida/máquina**: vistas previas, "analizando", edición previa al
  guardado, botón "agregar a rutina" en máquina.
- **Onboarding mínimo**: bienvenida + crear primer perfil + crear primera
  rutina (puede usar la IA para generarla).
- **Componentes base que faltan**: `Toast`, `ErrorState`, `IconButton`,
  `SearchInput`, `SegmentedControl`, `BottomSheetPicker` genérico, `StatCard`,
  `ProgressCard`, `FloatingAIButton`, `MultiSelect`.

## Productivo (antes de salir de beta)

- **Migrar todas las pantallas restantes a `useTheme`** para 100% light/dark.
- **Tipos generados desde Supabase** (mencionado en README, bloquea calidad de
  queries directas en el futuro).
- **Firmado de URLs de imagen desde backend** en vez de frontend (mejor
  control de permisos en Storage).
- **Sustituir valores nutricionales aproximados** del catálogo local por una
  fuente validada (USDA o BEDCA + porciones chilenas).
- **Manejo de errores end-to-end**: toasts globales, retry en red caída.
- **Tests E2E mínimos** para los flujos core: login → crear perfil → crear
  rutina → registrar entreno → registrar comida.
- **Auditoría de seguridad**: ya hay `docs/SECURITY.md`; revisar RLS, scope
  de service-role key, rotación de tokens.
- **Privacidad infantil**: si la app es familiar, definir flujo para perfiles
  de menores y restricciones de IA.
- **i18n** real (hoy todo es es-CL inline).
- **Observabilidad**: logs estructurados en backend + Sentry/equivalente en
  móvil.

## Futuro (después de producción)

- **AI Arena** (ya documentado en `docs/AI_ARENA.md`).
- **Rutinas generadas por IA** con confirmación humana.
- **Plan semanal de comidas** con lista de compras estimada.
- **Conexión a wearables** (HealthKit / Google Fit).
- **Reto familiar / streaks** con notificaciones.
- **Soporte offline** real con sincronización al volver a red.
- **Modo coach** para entrenadores que gestionan varios perfiles familiares.
- **Marketplace de rutinas** compartidas (con moderación).
