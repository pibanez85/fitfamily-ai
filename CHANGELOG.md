# Registro de cambios

Lista de cambios de FitFamily AI. Sirve para saber qué entra en cada versión
de la app antes de publicar un APK nuevo.

**Cómo funciona:**
- **Cambios de app** (pantallas, botones, flujos): los usuarios los ven solo
  después de **compilar e instalar un APK nuevo**. Se acumulan en "Sin publicar".
- **Cambios de servidor / IA** (backend en Render, config de Supabase): llegan
  **automáticamente**, sin reinstalar. Se marcan como "ya activo".

**Al publicar una versión:** sube `android.versionCode` en
[`apps/mobile/app.json`](apps/mobile/app.json), genera el APK
(ver [docs/COMPARTIR_APK.md](docs/COMPARTIR_APK.md)) y mueve lo de "Sin publicar"
a una sección con la fecha.

---

## [Sin publicar] — próxima versión de la app (usar versionCode 5)

### Nuevo
- **La IA arma la rutina de verdad**: "IA arma mi rutina completa" ahora usa tu
  objetivo, nivel y lo que escribes (ej. "quiero piernas", "solo mancuernas")
  para construir la rutina, eligiendo ejercicios reales del catálogo.
- **Icono propio de la app** y pantalla de carga (splash) con la identidad menta.
- **Editar rutinas** ya creadas (días, ejercicios, series, reps, descanso, notas).
- **Foto con cámara** además de galería para analizar comidas y máquinas.

### Mejoras
- **Rediseño visual premium "aurora"**: barra de navegación flotante con
  difuminado, botones con degradado, tarjetas tipo vidrio, formularios, gráficos,
  perfiles con avatar de color y pantalla de inicio renovada.
- **Modo claro** completo en toda la app (Ajustes → Apariencia).
- **Avances** ahora muestra datos reales (sesiones, volumen, peso, correlación
  con nutrición) y un resumen honesto, con filtro 7d/30d/90d funcional.
- **Metas de nutrición por perfil** (según sexo, edad, objetivo y peso), en vez
  de una meta fija para todos.
- **Cronómetro de descanso flotante** que arranca solo al completar una serie.
- Chat con **preguntas sugeridas** tocables para partir más fácil.
- Wizard de crear rutina más corto y ordenado; accesos rápidos del inicio
  reducidos; título propio para la pestaña Entreno; tildes en toda la app.

### Correcciones
- **Subir foto desde galería/cámara en Android**: ya no se queda pegado en la
  pantalla de recortar ni falla la subida a Storage.

### Servidor / IA — ya activo (sin reinstalar)
- **Coach IA más obediente**: sigue mejor lo que pide el usuario.
- **Recuperación de contraseña** abre la app correctamente (config de Supabase).
- **Promedios del panel** corregidos (promedio diario, no por comida).
- **Límite de uso** en los endpoints de IA para proteger el gasto de OpenAI.
- API en plan **Render Starter**: sin "arranque en frío", conexión estable.

---

## [Publicado]

_Aún no se registra una versión publicada con este changelog. La primera APK
privada se repartió a la familia antes de empezar este registro._
