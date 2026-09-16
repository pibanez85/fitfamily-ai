# Auditoría de uso semanal — FitFamily

## Alcance y evidencia

Esta auditoría combina revisión del código, simulación automatizada y navegación real en el navegador por siete fechas consecutivas. **No equivale a siete días reales de uso humano.** Las pruebas trabajan con datos sintéticos y no modifican la cuenta ni los registros reales de la familia.

Pruebas de alimentación: `apps/mobile/src/utils/mealDiary.test.ts`. Ejecución reproducible desde la raíz:

```powershell
node node_modules/vitest/vitest.mjs run apps/mobile/src/utils/mealDiary.test.ts
node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json
```

Las pruebas de alimentación forman parte de la suite completa. La evidencia de navegación y persistencia se detalla a continuación. Se utilizaron únicamente perfiles y datos del modo demo local.

## Hallazgos y correcciones de alimentación

| Antes                                                                                                                                          | Después                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| La vista «hoy» se memorizaba únicamente al cambiar la lista de comidas; permanecer abierta de noche conservaba los totales de ayer.            | `useLocalDay` actualiza la fecha al llegar la medianoche local y al volver a la app. Los totales dependen del día seleccionado.                                                                  |
| No existía navegación diaria útil para consultar o completar una semana.                                                                       | Diario de siete fechas, anterior/siguiente, volver a hoy y entrada retroactiva. Los enlaces con `?date=YYYY-MM-DD` abren el día pedido.                                                          |
| Las comidas `other` aumentaban los totales pero no aparecían en los cuatro grupos visibles. Las fotos se confirmaban como `other` por defecto. | Todos los tipos se incluyen en el diario, sin recortar a dos comidas por grupo.                                                                                                                  |
| Los «recientes» eran los alimentos seleccionados en el formulario actual; los favoritos desaparecían al salir.                                 | Sugerencias recientes derivadas de comidas guardadas, repetición de comidas anteriores y eliminación del falso apartado de favoritos.                                                            |
| El formulario empezaba con un resumen grande y exigía recorrer búsqueda, selección y varias tarjetas antes de guardar.                         | Búsqueda directa, porciones visibles, entrada manual para etiquetas, resumen compacto y un botón de guardar.                                                                                     |
| Los formularios y análisis podían conservar contexto al cambiar el perfil familiar.                                                            | La entrada de alimentos se remonta por perfil; el diario filtra también por perfil y rechaza respuestas tardías de otro perfil. El estado global de análisis se limpia en la revisión del store. |
| La confirmación de fotos usaba siempre la hora actual y no permitía fecha retroactiva.                                                         | La fecha elegida viaja por foto → análisis → confirmación; además puede corregirse antes de guardar.                                                                                             |
| Valores nutricionales inválidos de la confirmación se convertían silenciosamente en cero.                                                      | Validación de números finitos no negativos, con coma decimal permitida.                                                                                                                          |
| No había forma desde el diario de corregir un registro duplicado eliminándolo.                                                                 | Eliminación con confirmación explícita dentro del registro y recálculo del total después del éxito.                                                                                              |

## Simulación automatizada de siete días

1. **3–9 septiembre de 2026:** cada día empieza vacío para Pablo; se registran desayuno y cena distintos, además del almuerzo de otro perfil. Se comprueban los totales de ambos, el historial previo y 21 registros al terminar. La serialización y recarga de las filas comprueba que la lógica no depende de referencias en memoria; no prueba por sí sola Supabase ni el almacenamiento del dispositivo.
2. **Medianoche:** «hoy» avanza mientras una fecha histórica explícita queda fija. El cálculo de la siguiente medianoche se comprueba a 100 ms del cambio.
3. **Cena de Chile a las 23:45:** una marca UTC del día siguiente permanece en el día local correcto.
4. **Foto / tipo `other`:** aparece en los grupos y en el mismo total diario que las comidas ordinarias.
5. **Repetición:** copiar una comida conserva sus porciones y macros, usa la fecha de destino y no mueve ni muta el registro original.
6. **Calendario:** cambio de mes, año y horario de verano en Santiago. El 5–6 de septiembre representa 23 horas, manteniendo fechas consecutivas correctas.
7. **Entrada inválida:** rechaza 30 de febrero, mes 13 y texto sin fecha; una fecha de calendario no se interpreta como medianoche UTC.

## Recorrido real por el navegador

Prueba en `http://localhost:8086`, el 16 de septiembre de 2026. Se revisó escritorio (1280 × 720) y pantalla móvil (390 × 844).

| Paso                                    | Resultado observado                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Abrir las fechas 10–16 de septiembre    | Totales iniciales distintos: 1760, 1620, 1660, 1840, 0, 0 y 1200 kcal. No se arrastraron comidas de un día al siguiente.    |
| Registrar una comida manual el lunes 14 | «Prueba semanal · yogur», 150 kcal y proteína con coma decimal (`12,5`), quedó solamente en el día 14.                      |
| Abrir el martes 15                      | Continuó vacío hasta pulsar repetir la comida. Después mostró 150 kcal; el lunes conservó su registro original.             |
| Recargar la página                      | Se recuperaron sesión, perfil y comida guardada. La selección histórica permanece en el enlace `?date=…`.                   |
| Revisar e incorporar el PDF             | Se desplegaron sus cinco sesiones y alternativas, se confirmó la revisión y quedó activo para Pato en demo.                 |
| Entrenar el miércoles                   | La app seleccionó «Brazos + hombros», correspondiente al calendario de la rutina, en lugar de volver siempre al primer día. |
| Abrir una sesión vacía                  | Finalizar permaneció deshabilitado con cero series completadas.                                                             |
| Registrar 20,5 kg × 8 repeticiones      | Se marcó únicamente una serie. Después de recargar, el borrador recuperó valores, casilla y progreso.                       |
| Finalizar esa sesión                    | El historial mostró una sola serie y 164 kg de volumen, sin inventar las demás series planificadas.                         |
| Cambiar de Pato a Yayi                  | Aparecieron sus propios alimentos, peso y sesiones; la rutina PDF de Pato no pasó al otro perfil.                           |
| Revisar el dashboard móvil              | Encabezado, tarjetas y navegación inferior caben en 390 px sin recortes horizontales.                                       |

## Entrenamiento, rutina e IA

- Se incorporó una plantilla revisable del PDF de seis páginas: cinco sesiones y 39 entradas de ejercicios, con jueves y domingo sin pesas. Conserva RIR, alternativas y el rango de 2–3 series unilateral; permite elegirlas antes de importar. No se añadieron cargas ni descansos que el PDF no indica.
- El registro guarda solo series marcadas y válidas. Admite coma decimal, conserva borradores por perfil/rutina/día y calcula el descanso desde una hora de vencimiento para poder recuperarlo al volver a la app.
- Se quitaron acciones que aparentaban aplicar cambios de IA pero solo alteraban un texto. Las consultas se presentan como sugerencias; el editor permite modificar la rutina.
- La generación transmite instrucciones, frecuencia, equipo disponible, exclusiones y tiempo solicitado. El servidor valida frecuencia, ejercicios permitidos, duplicados y rangos de series/descansos. El tiempo solicitado se envía como instrucción; no hay un cronómetro predictivo que garantice la duración real.
- El coach recibe los mensajes anteriores del hilo correspondiente. Cambiar de perfil limpia la conversación visible y los análisis pendientes.
- Una generación fallida conserva el borrador y muestra el error. No se sustituye silenciosamente por una plantilla presentada como personalizada. En demo se informa que no hay IA real.

## Hallazgos adicionales en Progreso

Al navegar a «7d», el historial de peso reutilizaba registros más antiguos cuando faltaban mediciones, pero describía su diferencia como si hubiera ocurrido esa semana. También mostraba una mejora desde cero para ejercicios realizados una sola vez. Se separó el historial de la comparación dentro del período: ahora solo hay variación de peso con dos mediciones del período y solo hay mejora de carga cuando existe una sesión anterior. Los períodos incluyen días locales completos, sin incluir fechas futuras. Cuatro pruebas específicas cubren estos casos en `progressData.test.ts`.

## Persistencia después de cerrar y volver a abrir

`apps/mobile/src/services/demoPersistence.test.ts` añade pruebas de siete recargas completas del módulo: las comidas, sus ítems y las sesiones sobreviven a la recarga y permanecen aisladas por perfil. También comprueba eliminación persistida, recuperación ante fallo al guardar, rechazo de un archivo corrupto sin sobreescribirlo y restauración/cierre de la sesión demo. La sesión demo guarda un identificador local, sin contraseña ni tokens reales.

Las preferencias (perfil y rutina activa) y los borradores usan almacenamiento del dispositivo. En el backend real los registros siguen en Supabase; no se aplicaron migraciones ni se modificaron registros reales durante esta auditoría.

## Límites y seguimiento

- El listado usa la API existente de comidas completas por perfil. Para historiales largos conviene agregar filtros por rango y paginación al backend.
- El nuevo dashboard móvil agrupa con la fecha local, igual que el diario. El endpoint antiguo de estadísticas del backend aún agrupa en UTC; queda pendiente unificarlo para otros consumidores, incluido el contexto del coach.
- El backend anterior inserta la comida y sus ítems en operaciones separadas; un fallo intermedio requiere tratamiento transaccional o compensación para evitar registros incompletos.
- El endpoint PATCH antiguo descarta `items`; por ello esta entrega no presenta edición de porciones guardadas como si estuviera completa. Se puede eliminar un registro y volver a ingresarlo.
- La estimación de fotos y la generación IA reales necesitan una API configurada y una validación adicional con proveedor real. Las pruebas sintéticas no acreditan exactitud nutricional.

## Verificación de código

- Suite completa: **67 pruebas aprobadas en 15 archivos** (14 del paquete compartido, 23 de API y 30 de móvil). Incluye transcripción PDF, restricciones de generación, historial del coach, calendario, series, persistencia y tratamiento de archivos de OneDrive en Windows.
- TypeScript de los tres paquetes sin errores.
- ESLint sin errores.
- El paquete compartido y la API compilan.
- La compatibilidad local de dependencias Expo se verificó con `expo install --check` offline; las dos diferencias nativas detectadas se corrigieron.

Para reproducir las pruebas tras instalar las dependencias y compilar el paquete compartido:

```powershell
pnpm --filter @fitfamily-ai/shared build
pnpm test
pnpm typecheck
pnpm lint
```
