import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { deviceStorage } from "@/services/localStorage";
import { darkColors, lightColors, radius, spacing, type ColorPalette } from "@/theme/colors";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ColorPalette;
  radius: typeof radius;
  spacing: typeof spacing;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const STORAGE_KEY = "fitfamily.theme.mode";
const DEFAULT_MODE: ThemeMode = "light";

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function readStoredMode(): Promise<ThemeMode | null> {
  try {
    const value = await deviceStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

async function persistMode(mode: ThemeMode): Promise<void> {
  try {
    await deviceStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // En web o sin almacenamiento seguro simplemente no persistimos.
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  useEffect(() => {
    let alive = true;
    readStoredMode().then((stored) => {
      if (alive && stored) setModeState(stored);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void persistMode(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      void persistMode(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === "dark" ? darkColors : lightColors,
      radius,
      spacing,
      setMode,
      toggle,
    }),
    [mode, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback seguro si algun componente se usa fuera del provider.
    return {
      mode: DEFAULT_MODE,
      colors: lightColors,
      radius,
      spacing,
      setMode: () => undefined,
      toggle: () => undefined,
    };
  }
  return context;
}
