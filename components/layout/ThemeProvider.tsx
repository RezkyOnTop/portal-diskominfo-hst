"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "hst-theme";

/**
 * ThemeProvider — mode terang/gelap dengan persistensi localStorage.
 *
 * Memakai useSyncExternalStore (bukan setState di effect) agar sinkron dengan
 * DOM/localStorage dan bebas flicker. Skrip anti-flicker di <head> memasang
 * kelas .dark sebelum paint; provider hanya menyinkronkan state React.
 */

// --- Store eksternal kecil (localStorage + preferensi sistem) ---
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* localStorage diblokir — jatuh ke preferensi sistem. */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
}

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    () => "light" as Theme,
  );

  // Sinkronkan DOM dengan state (tanpa setState — aman untuk lint hooks).
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* mode privat — abaikan. */
    }
    applyTheme(t);
    emit();
  }, []);

  const toggle = useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme harus dipakai di dalam <ThemeProvider>");
  }
  return ctx;
}

/** Skrip inline anti-flicker (dijalankan sebelum paint). */
export const themeInitScript = `(function(){try{var k="hst-theme";var s=localStorage.getItem(k);var d=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`;
