// Paletas de color para tema claro y oscuro.
// Ambas exponen EXACTAMENTE las mismas claves para poder intercambiarlas.

export type ColorPalette = {
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  energy: string;
  energySoft: string;
  warning: string;
  danger: string;
  success: string;
  shadow: string;
  overlay: string;
  /** Color de texto que se ve bien sobre primary/energy/danger (botones llenos). */
  onPrimary: string;
};

export const darkColors: ColorPalette = {
  background: "#07090d",
  backgroundElevated: "#0d1118",
  surface: "#111823",
  surfaceMuted: "#182232",
  surfaceStrong: "#1e293b",
  text: "#f8fafc",
  muted: "#9aa8bc",
  subtle: "#64748b",
  border: "#263244",
  primary: "#2dd4bf",
  primaryDark: "#0f766e",
  primarySoft: "#123c3a",
  accent: "#f43f5e",
  accentSoft: "#3b1422",
  energy: "#facc15",
  energySoft: "#3f3410",
  warning: "#f59e0b",
  danger: "#fb7185",
  success: "#22c55e",
  shadow: "#000000",
  overlay: "rgba(3, 7, 18, 0.58)",
  onPrimary: "#04110f",
};

export const lightColors: ColorPalette = {
  background: "#f4f6f9",
  backgroundElevated: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#eef2f7",
  surfaceStrong: "#e2e8f0",
  text: "#0f172a",
  muted: "#51607a",
  subtle: "#94a3b8",
  border: "#dce3ec",
  primary: "#0f766e",
  primaryDark: "#115e59",
  primarySoft: "#d6efea",
  accent: "#e11d48",
  accentSoft: "#fde4ea",
  energy: "#b45309",
  energySoft: "#fef3c7",
  warning: "#b45309",
  danger: "#dc2626",
  success: "#16a34a",
  shadow: "#0f172a",
  overlay: "rgba(15, 23, 42, 0.45)",
  onPrimary: "#ffffff",
};

// Compatibilidad: los modulos que aun no migraron a useTheme siguen importando
// `colors`. Apunta al tema oscuro (tema por defecto de la app).
export const colors: ColorPalette = darkColors;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};
