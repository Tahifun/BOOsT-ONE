import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppTheme = "epic" | "classic";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (next: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const LS_KEY = "app-theme";

type ProviderProps = {
  children: React.ReactNode;
  /** Optionaler Startwert */
  defaultTheme?: AppTheme;
};

export const ThemeProvider: React.FC<ProviderProps> = ({ children, defaultTheme = "classic" }) => {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(LS_KEY)) || "";
    return saved === "epic" || saved === "classic" ? (saved as AppTheme) : defaultTheme;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, theme);
    } catch {}
    // Optional: Theme-Klasse global auf <html>
    const root = document.documentElement;
    root.classList.remove("theme-epic", "theme-classic");
    root.classList.add(theme === "epic" ? "theme-epic" : "theme-classic");
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** Bevorzugter Hook-Name */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/** Alias f�r Legacy-Imports (z. B. useThemeContext) */
export const useThemeContext = useTheme;

// Optional, falls irgendwo der Context selbst gebraucht wird:
export { ThemeContext };
