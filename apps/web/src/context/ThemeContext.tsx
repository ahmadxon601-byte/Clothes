'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeCtx { isDark: boolean; toggle: () => void; }
const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(localStorage.getItem('admin_theme') === 'dark');
  }, []);

  const toggle = () => setIsDark(d => {
    const next = !d;
    localStorage.setItem('admin_theme', next ? 'dark' : 'light');
    return next;
  });

  return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
