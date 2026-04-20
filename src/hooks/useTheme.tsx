import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  ambientEnabled: boolean;
  setAmbientEnabled: (v: boolean) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
  ambientEnabled: true,
  setAmbientEnabled: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [ambientEnabled, setAmbientEnabledState] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = (localStorage.getItem("cyclesense-theme") as Theme | null) ?? "light";
    setThemeState(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");

    const ambient = localStorage.getItem("cyclesense-ambient");
    if (ambient !== null) setAmbientEnabledState(ambient === "true");
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof window !== "undefined") {
      localStorage.setItem("cyclesense-theme", t);
      document.documentElement.classList.toggle("dark", t === "dark");
    }
  };

  const setAmbientEnabled = (v: boolean) => {
    setAmbientEnabledState(v);
    if (typeof window !== "undefined") {
      localStorage.setItem("cyclesense-ambient", String(v));
    }
  };

  return (
    <Ctx.Provider
      value={{
        theme,
        setTheme,
        toggle: () => setTheme(theme === "light" ? "dark" : "light"),
        ambientEnabled,
        setAmbientEnabled,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
