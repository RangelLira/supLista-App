// ===========================
// CONTEXTO: TEMA
// ===========================

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { AccentColor, applyAccent, createGlobalStyles, darkColors, lightColors } from '../styles/theme';
import { loadSettings, saveSettings } from '../utils/storage';

export type ThemeType = 'auto' | 'claro' | 'escuro';
export type AppColors = typeof darkColors;
export type AppGlobalStyles = ReturnType<typeof createGlobalStyles>;

interface ThemeContextValue {
  colors: AppColors;
  globalStyles: AppGlobalStyles;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  accentColor: AccentColor;
  setAccentColor: (a: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  globalStyles: createGlobalStyles(darkColors),
  theme: 'escuro',
  setTheme: () => {},
  accentColor: 'roxo',
  setAccentColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('escuro');
  const [accentColor, setAccentColorState] = useState<AccentColor>('roxo');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme());

  // Carrega preferência salva
  useEffect(() => {
    loadSettings().then(s => {
      if (s.theme) setThemeState(s.theme as ThemeType);
      if (s.accentColor) setAccentColorState(s.accentColor as AccentColor);
    });
  }, []);

  // Listener de mudança do sistema (modo auto)
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    saveSettings({ theme: t } as any);
  };

  const setAccentColor = (a: AccentColor) => {
    setAccentColorState(a);
    saveSettings({ accentColor: a });
  };

  // Resolve o tema efetivo: auto usa preferência do sistema
  const resolvedDark = theme === 'auto'
    ? systemScheme !== 'light'
    : theme === 'escuro';

  const colors = useMemo(
    () => applyAccent(resolvedDark ? darkColors : lightColors, accentColor, resolvedDark),
    [resolvedDark, accentColor]
  );

  const globalStyles = useMemo(
    () => createGlobalStyles(colors),
    [colors]
  );

  return (
    <ThemeContext.Provider value={{ colors, globalStyles, theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
