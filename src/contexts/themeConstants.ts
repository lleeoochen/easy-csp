export type ThemeName = 'ocean' | 'forest' | 'sunset' | 'pink' | 'purple' | 'dark';

interface Theme {
  name: ThemeName;
  colors: {
    background: string;
    primaryBg: string;
    primaryFg: string;
    secondaryBg: string;
    secondaryFg: string;
    tabsBarBg: string;
    tabsBarFg: string;
    tabsBarActiveBg: string;
    tabsBarActiveFg: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  ocean: {
    name: 'ocean',
    colors: {
      background: '#2b91ba',
      primaryBg: '#2e6d9c',
      primaryFg: '#ffffff',
      secondaryBg: '#d1d5db',
      secondaryFg: '#000000',
      tabsBarBg: '#1c5b89cc',
      tabsBarFg: '#ffffff',
      tabsBarActiveBg: '#ffffff',
      tabsBarActiveFg: '#2e6d9c',
    },
  },
  forest: {
    name: 'forest',
    colors: {
      background: '#2d8659',
      primaryBg: '#1e6f4f',
      primaryFg: '#ffffff',
      secondaryBg: '#d1d5db',
      secondaryFg: '#000000',
      tabsBarBg: '#155a3ecc',
      tabsBarFg: '#ffffff',
      tabsBarActiveBg: '#ffffff',
      tabsBarActiveFg: '#1e6f4f',
    },
  },
  sunset: {
    name: 'sunset',
    colors: {
      background: '#d97706',
      primaryBg: '#c2410c',
      primaryFg: '#ffffff',
      secondaryBg: '#d1d5db',
      secondaryFg: '#000000',
      tabsBarBg: '#9a3412cc',
      tabsBarFg: '#ffffff',
      tabsBarActiveBg: '#ffffff',
      tabsBarActiveFg: '#c2410c',
    },
  },
  pink: {
    name: 'pink',
    colors: {
      background: '#c29ac9',
      primaryBg: '#ab82b3',
      primaryFg: '#ffffff',
      secondaryBg: '#d1d5db',
      secondaryFg: '#000000',
      tabsBarBg: '#ab82b3cc',
      tabsBarFg: '#ffffff',
      tabsBarActiveBg: '#ffffff',
      tabsBarActiveFg: '#c2410c',
    },
  },
  purple: {
    name: 'purple',
    colors: {
      background: '#75569e',
      primaryBg: '#5e4284',
      primaryFg: '#ffffff',
      secondaryBg: '#d1d5db',
      secondaryFg: '#000000',
      tabsBarBg: '#5e4284cc',
      tabsBarFg: '#ffffff',
      tabsBarActiveBg: '#ffffff',
      tabsBarActiveFg: '#c2410c',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      background: '#1f2937',
      primaryBg: '#111827',
      primaryFg: '#ffffff',
      secondaryBg: '#4b5563',
      secondaryFg: '#ffffff',
      tabsBarBg: '#0f172acc',
      tabsBarFg: '#ffffff',
      tabsBarActiveBg: '#ffffff',
      tabsBarActiveFg: '#111827',
    },
  },
};

export const THEME_STORAGE_KEY = 'easy-csp-theme';
