const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Valores placeholder que vienen en .env.example. Si las variables siguen en
// estos valores (o vacias), corremos en modo demo en lugar de crashear.
const PLACEHOLDER_FRAGMENTS = ["your-project", "your-public-anon-key", "your-", "example.com"];

function isPlaceholder(value: string): boolean {
  if (!value.trim()) return true;
  const lower = value.toLowerCase();
  return PLACEHOLDER_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

function looksLikeRealUrl(value: string): boolean {
  return value.startsWith("http") && !isPlaceholder(value);
}

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000",
  supabaseUrl: rawSupabaseUrl,
  supabaseAnonKey: rawSupabaseAnonKey,
};

// hasRealBackend = hay credenciales reales de Supabase configuradas.
export const hasRealBackend =
  looksLikeRealUrl(rawSupabaseUrl) && !isPlaceholder(rawSupabaseAnonKey);

// isDemoMode = corremos con datos simulados en memoria, sin Supabase ni API.
// Permite abrir la app en Expo Go o web sin configurar nada.
export const isDemoMode = !hasRealBackend;

export function hasMobileEnv() {
  return hasRealBackend;
}
