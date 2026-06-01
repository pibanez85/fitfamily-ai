# Checklist para produccion

Este MVP esta preparado para crecer, pero antes de publicarlo como app real hay que cerrar varios puntos.

## Seguridad

- [ ] Rotar cualquier clave o password compartida por error.
- [ ] Verificar que `.env` no este en Git.
- [ ] Revisar logs para que no impriman secretos.
- [ ] Activar HTTPS en backend productivo.
- [ ] Configurar CORS con dominios permitidos.
- [ ] Agregar rate limit por usuario/IP.
- [ ] Agregar proteccion contra abuso en endpoints IA.
- [ ] Revisar RLS con tests.
- [ ] Revisar policies de Storage.
- [ ] Mover firmado de URLs de Storage al backend.

## Supabase

- [ ] Aplicar migraciones en proyecto productivo.
- [ ] Cargar seed inicial de ejercicios.
- [ ] Configurar backups.
- [ ] Configurar Auth email.
- [ ] Configurar templates de email.
- [ ] Revisar limites del plan Supabase.
- [ ] Generar tipos desde Supabase.

## OpenAI

- [ ] Crear API key productiva separada.
- [ ] Definir limites de gasto.
- [ ] Configurar modelo texto y vision.
- [ ] Mantener `AI_ARENA_ENABLED=false` en produccion.
- [ ] Agregar logs de latencia sin datos sensibles.
- [ ] Agregar manejo de rate limits.

## Mobile

- [ ] Crear build nativo con EAS.
- [ ] Configurar iconos y splash.
- [ ] Revisar permisos de galeria/camara.
- [ ] Probar Android real.
- [ ] Probar iPhone real.
- [ ] Revisar accesibilidad basica.
- [ ] Revisar experiencia offline o errores de red.

## Backend

- [ ] Desplegar API en hosting productivo.
- [ ] Configurar variables productivas.
- [ ] Configurar health checks.
- [ ] Configurar logs y monitoreo.
- [ ] Configurar alertas.
- [ ] Agregar tests de integracion.

## Producto

- [ ] Politica de privacidad.
- [ ] Terminos de uso.
- [ ] Disclaimer salud/nutricion/entrenamiento.
- [ ] Flujo de eliminacion de cuenta.
- [ ] Flujo de exportacion de datos.
- [ ] Edicion y borrado de fotos.
- [ ] Mejorar catalogo nutricional.
- [ ] Mejorar creacion visual de rutinas.

## Calidad

- [ ] `pnpm typecheck` OK.
- [ ] `pnpm lint` OK.
- [ ] `pnpm test` OK.
- [ ] `pnpm build` OK.
- [ ] Prueba manual completa OK.
- [ ] Prueba con usuario nuevo OK.
- [ ] Prueba con dos perfiles familiares OK.

## No publicar si

- hay claves privadas en mobile
- backend usa `localhost` en produccion
- RLS no fue revisado
- OpenAI key esta en Expo
- Storage es publico sin necesidad
- errores muestran secretos
- la app no permite corregir estimaciones de IA
