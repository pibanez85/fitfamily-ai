// Paletas de color para tema claro y oscuro.
// Ambas exponen EXACTAMENTE las mismas claves para poder intercambiarlas.
//
// Identidad visual: "aurora" — fondo azul-noche profundo con un resplandor
// menta/cian sutil, superficies translucidas tipo vidrio y acentos calidos.

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
  /** Degradado principal (botones llenos, anillos, CTA). */
  gradientFrom: string;
  gradientTo: string;
  /** Degradado sutil del fondo de pantalla (de arriba hacia abajo). */
  backgroundGlow: string;
  /** Superficie "vidrio" translucida para overlays y navegacion. */
  glass: string;
  glassBorder: string;
};

export const darkColors: ColorPalette = {
  background: "#070b14",
  backgroundElevated: "#0c1322",
  surface: "rgba(22, 32, 50, 0.82)",
  surfaceMuted: "rgba(34, 47, 70, 0.55)",
  surfaceStrong: "#25334e",
  text: "#f6f8fc",
  muted: "#9cabc2",
  subtle: "#64748b",
  border: "rgba(148, 163, 184, 0.16)",
  primary: "#3ee6c4",
  primaryDark: "#0f9e85",
  primarySoft: "rgba(62, 230, 196, 0.12)",
  accent: "#fb7185",
  accentSoft: "rgba(251, 113, 133, 0.14)",
  energy: "#fbbf24",
  energySoft: "rgba(251, 191, 36, 0.14)",
  warning: "#f59e0b",
  danger: "#fb7185",
  success: "#34d399",
  shadow: "#000000",
  overlay: "rgba(4, 8, 16, 0.6)",
  onPrimary: "#04120e",
  gradientFrom: "#34d399",
  gradientTo: "#22d3ee",
  backgroundGlow: "rgba(45, 212, 191, 0.07)",
  glass: "rgba(12, 19, 34, 0.72)",
  glassBorder: "rgba(148, 163, 184, 0.14)",
};

export const lightColors: ColorPalette = {
  background: "#f3f6fb",
  backgroundElevated: "#ffffff",
  surface: "rgba(255, 255, 255, 0.9)",
  surfaceMuted: "rgba(226, 233, 243, 0.7)",
  surfaceStrong: "#e2e8f0",
  text: "#0c1526",
  muted: "#4d5e78",
  subtle: "#94a3b8",
  border: "rgba(15, 33, 63, 0.1)",
  primary: "#0d9484",
  primaryDark: "#0c7a6d",
  primarySoft: "rgba(13, 148, 132, 0.1)",
  accent: "#e11d48",
  accentSoft: "rgba(225, 29, 72, 0.1)",
  energy: "#b45309",
  energySoft: "rgba(180, 83, 9, 0.12)",
  warning: "#b45309",
  danger: "#dc2626",
  success: "#0e9f6e",
  shadow: "#0f172a",
  overlay: "rgba(15, 23, 42, 0.45)",
  onPrimary: "#ffffff",
  gradientFrom: "#0d9484",
  gradientTo: "#0891b2",
  backgroundGlow: "rgba(13, 148, 132, 0.06)",
  glass: "rgba(255, 255, 255, 0.78)",
  glassBorder: "rgba(15, 33, 63, 0.08)",
};

// Compatibilidad: los modulos que aun no migraron a useTheme siguen importando
// `colors`. Apunta al tema oscuro (tema por defecto de la app).
export const colors: ColorPalette = darkColors;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};
