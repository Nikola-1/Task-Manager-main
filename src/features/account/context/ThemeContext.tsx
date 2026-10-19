"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type UITheme = "light" | "dark" | "system" | "retro" | "mario";
const storageKey = "task-manager-ui-theme";
const ThemeContext = createContext<{
  theme: UITheme;
  setTheme: (theme: UITheme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<UITheme>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark" || saved === "system" || saved === "retro" || saved === "mario") setThemeState(saved);
    } catch {
      // Theme selection still works when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      document.documentElement.dataset.theme = theme === "system"
        ? (preference.matches ? "dark" : "light") : theme;
    };
    applyTheme();
    preference.addEventListener("change", applyTheme);
    return () => preference.removeEventListener("change", applyTheme);
  }, [theme]);

  const setTheme = (value: UITheme) => {
    setThemeState(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // Keep the current selection even if it cannot be persisted.
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
