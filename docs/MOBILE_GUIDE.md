# Guia mobile

La app mobile esta en:

```txt
apps/mobile
```

## Stack mobile

- Expo
- React Native
- TypeScript
- Expo Router
- Zustand
- React Hook Form
- Zod
- Expo Image Picker
- Expo SecureStore
- Supabase Auth

## Navegacion

Archivo principal:

```txt
apps/mobile/app/_layout.tsx
```

Pantallas:

```txt
app/index.tsx
app/login.tsx
app/register.tsx
app/profiles/index.tsx
app/profiles/edit.tsx
app/dashboard.tsx
app/today.tsx
app/workouts/index.tsx
app/workouts/[workoutId].tsx
app/workouts/log.tsx
app/workouts/history.tsx
app/workouts/progress.tsx
app/meals/index.tsx
app/meals/new.tsx
app/meals/photo.tsx
app/meals/analysis.tsx
app/meals/confirm.tsx
app/machines/photo.tsx
app/machines/analysis.tsx
app/chat.tsx
app/body-metrics.tsx
app/settings.tsx
```

## Flujo de inicio

1. `index.tsx` revisa si hay sesion.
2. Si no hay sesion, envia a `/login`.
3. Login usa Supabase Auth.
4. Si login es correcto, navega a `/profiles`.
5. La pantalla de perfiles carga perfiles desde backend.
6. Al seleccionar perfil, la app guarda `activeProfileId`.
7. Dashboard usa el perfil activo.

## Estado global

Archivo:

```txt
apps/mobile/src/store/appStore.ts
```

Guarda:

- `session`
- `profiles`
- `activeProfileId`
- `pendingFoodAnalysis`
- `pendingMachineAnalysis`

## Cliente Supabase mobile

Archivo:

```txt
apps/mobile/src/lib/supabase.ts
```

Responsabilidades:

- crear cliente Supabase
- guardar sesion en SecureStore
- fallback web con localStorage
- modo demo en memoria si no hay credenciales reales

## Cliente API

Archivo:

```txt
apps/mobile/src/services/api.ts
```

Responsabilidades:

- obtener access token de Supabase
- enviar `Authorization: Bearer <token>`
- llamar al backend
- manejar errores de token vencido
- usar `demoApi` si no hay backend real configurado

## Fotos

Archivo:

```txt
apps/mobile/src/services/storage.ts
```

Flujo:

1. Pide permiso de galeria.
2. Abre selector de imagen.
3. Sube imagen a Supabase Storage.
4. Crea URL firmada temporal.
5. Envia URL firmada al backend para IA.

Buckets:

- `meal-photos`
- `machine-photos`
- `progress-photos`

## UI

Componentes base:

```txt
src/components/AppButton.tsx
src/components/BottomNav.tsx
src/components/BrandHero.tsx
src/components/Card.tsx
src/components/ChoiceGroup.tsx
src/components/DatePickerField.tsx
src/components/FormField.tsx
src/components/MetricPill.tsx
src/components/Screen.tsx
src/components/StateViews.tsx
src/components/Typography.tsx
```

Tema:

```txt
src/theme/colors.ts
src/theme/images.ts
```

Direccion visual actual:

- oscuro
- moderno
- gimnasio premium
- textos simples
- tarjetas legibles
- colores de acento para energia y progreso

## Catalogo local de alimentos

Archivo:

```txt
apps/mobile/src/data/foodCatalog.ts
```

Contiene alimentos base con macros por 100 g. La pantalla `meals/new.tsx` permite buscar alimentos, definir gramos y calcular macros automaticamente.

Pendiente recomendado:

- conectar una base nutricional externa confiable
- agregar alimentos frecuentes chilenos
- guardar favoritos por perfil
- permitir porciones caseras: taza, cucharada, unidad, plato

## Notas Expo Go

Expo Go sirve para desarrollo rapido, pero tiene limitaciones. Para produccion se debe crear build nativo con EAS.

Si Expo Go dice que el proyecto requiere una version mas nueva, actualiza Expo Go desde Play Store o App Store.

Si Metro queda raro, reinicia con:

```bat
node --use-system-ca ../../node_modules/expo/bin/cli start --clear
```
