# Pruebas y calidad

## Comandos

Desde la raiz:

```bat
npx pnpm@11.3.0 typecheck
npx pnpm@11.3.0 lint
npx pnpm@11.3.0 test
npx pnpm@11.3.0 build
```

## Typecheck

```bat
npx pnpm@11.3.0 typecheck
```

Valida TypeScript en:

- `packages/shared`
- `apps/api`
- `apps/mobile`

## Lint

```bat
npx pnpm@11.3.0 lint
```

Valida reglas ESLint.

## Tests

```bat
npx pnpm@11.3.0 test
```

Incluye:

- validacion Zod de analisis de comida
- validacion Zod de analisis de maquina
- construccion de contexto del chat
- ownership basico de `profileId`

Mobile aun no tiene tests unitarios reales. El MVP se apoya en TypeScript y pruebas manuales en Expo Go.

## Prueba manual minima

1. Levantar API.
2. Abrir Expo Go.
3. Crear cuenta.
4. Iniciar sesion.
5. Crear perfil.
6. Entrar al dashboard.
7. Crear comida manual.
8. Probar catalogo de alimentos.
9. Subir foto de comida.
10. Confirmar comida analizada.
11. Subir foto de maquina.
12. Usar chat.

## Prueba backend

Health:

```bat
curl http://localhost:4000/health
```

Respuesta esperada:

```json
{"ok":true,"service":"fitfamily-ai-api"}
```

## Antes de cada entrega

Ejecutar:

```bat
npx pnpm@11.3.0 typecheck
npx pnpm@11.3.0 lint
npx pnpm@11.3.0 test
```

Si alguno falla, no pasar a produccion.
