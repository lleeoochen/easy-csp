import { createContext } from 'react';
import type { ThemeName } from './themeConstants';

export interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
