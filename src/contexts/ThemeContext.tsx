import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ThemeName } from './themeConstants';
import { themes, THEME_STORAGE_KEY } from './themeConstants';
import { ThemeContext } from './createThemeContext';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeName) || 'ocean';
  });

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    const themeColors = themes[theme].colors;

    root.style.setProperty('--color-background', themeColors.background);
    root.style.setProperty('--color-primary-bg', themeColors.primaryBg);
    root.style.setProperty('--color-primary-fg', themeColors.primaryFg);
    root.style.setProperty('--color-secondary-bg', themeColors.secondaryBg);
    root.style.setProperty('--color-secondary-fg', themeColors.secondaryFg);
    root.style.setProperty('--color-tabs-bar-bg', themeColors.tabsBarBg);
    root.style.setProperty('--color-tabs-bar-fg', themeColors.tabsBarFg);
    root.style.setProperty('--color-tabs-bar-active-bg', themeColors.tabsBarActiveBg);
    root.style.setProperty('--color-tabs-bar-active-fg', themeColors.tabsBarActiveFg);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
