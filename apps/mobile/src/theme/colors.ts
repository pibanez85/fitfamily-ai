// Paletas de color para tema claro y oscuro.
// Ambas exponen EXACTAMENTE las mismas claves para poder intercambiarlas.
//
// Identidad visual: "lime premium" — base clara y limpia con tarjetas
// blancas de alto contraste, tipografia grande y un acento lima/oliva
// en degradado como color de marca (CTAs, anillos, estado activo).

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
  background: "#0D0F13",
  backgroundElevated: "#171A21",
  surface: "rgba(255, 255, 255, 0.06)",
  surfaceMuted: "rgba(255, 255, 255, 0.04)",
  surfaceStrong: "#20242D",
  text: "#F6F8FC",
  muted: "#9CA3AF",
  subtle: "#6B7280",
  border: "rgba(255, 255, 255, 0.09)",
  primary: "#A3E635",
  primaryDark: "#65A30D",
  primarySoft: "rgba(163, 230, 53, 0.14)",
  accent: "#FF8A3D",
  accentSoft: "rgba(255, 138, 61, 0.14)",
  energy: "#7C6CF6",
  energySoft: "rgba(124, 108, 246, 0.16)",
  warning: "#FF8A3D",
  danger: "#FF5C6E",
  success: "#A3E635",
  shadow: "#000000",
  overlay: "rgba(4, 8, 16, 0.6)",
  onPrimary: "#1A2B05",
  gradientFrom: "#C4F171",
  gradientTo: "#65A30D",
  backgroundGlow: "rgba(163, 230, 53, 0.06)",
  glass: "rgba(23, 26, 33, 0.78)",
  glassBorder: "rgba(255, 255, 255, 0.10)",
};

export const lightColors: ColorPalette = {
  background: "#F1F3EC",
  backgroundElevated: "#ffffff",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F3EC",
  surfaceStrong: "#E7EBDC",
  text: "#12151A",
  muted: "#70757E",
  subtle: "#A4A9B2",
  border: "#ECEDF0",
  primary: "#65A30D",
  primaryDark: "#3F6212",
  primarySoft: "#EEFAD1",
  accent: "#FF8A3D",
  accentSoft: "#FFF1E6",
  energy: "#7C6CF6",
  energySoft: "#F1EFFF",
  warning: "#FF8A3D",
  danger: "#FF5C6E",
  success: "#3F6212",
  shadow: "#0F172A",
  overlay: "rgba(15, 23, 42, 0.45)",
  onPrimary: "#1A2B05",
  gradientFrom: "#C4F171",
  gradientTo: "#65A30D",
  backgroundGlow: "transparent",
  glass: "rgba(255, 255, 255, 0.78)",
  glassBorder: "rgba(15, 33, 63, 0.06)",
};

// Compatibilidad: los modulos que aun no migraron a useTheme siguen importando
// `colors`. Apunta al tema oscuro (tema por defecto de la app).
export const colors: ColorPalette = lightColors;

export const radius = {
  sm: 14,
  md: 22,
  lg: 28,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};
