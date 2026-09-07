/**
 * Tema derivado das definições do utilizador (que vêm do servidor, por isso
 * a preferência de tema acompanha-te entre a app e o site).
 */

import React, { createContext, useContext, useMemo } from 'react';
import { buildTheme } from '../theme/theme';
import { useStore } from './StoreContext';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { settings } = useStore();
  const theme = useMemo(
    () => buildTheme(settings?.theme, settings?.font, settings?.palette),
    [settings?.theme, settings?.font, settings?.palette],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme tem de ser usado dentro de <ThemeProvider>');
  return ctx;
}
