import { useTheme } from '@/hooks/useTheme';
import type { ThemeName } from '@/contexts/themeConstants';
import { themes } from '@/contexts/themeConstants';
import { Card, CardContent, CardHeader } from './common/card';
import { Palette } from 'lucide-react';

export const ThemeSelector = () => {
  const { theme: currentTheme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader className="text-lg flex items-center">
        <Palette className="w-5 h-5 mr-2" />
        Theme
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap mr-auto gap-4 p-2">
          {(Object.keys(themes) as ThemeName[]).map((themeName) => {
            const theme = themes[themeName];
            const isActive = currentTheme === themeName;

            return (
              <button
                key={themeName}
                onClick={() => setTheme(themeName)}
                className={`w-16 h-16 rounded-lg transition-all cursor-pointer ${
                  isActive ? 'ring-2 ring-offset-1 ring-primary-bg scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: theme.colors.background }}
                aria-label={`${themeName} theme`}
                title={themeName.charAt(0).toUpperCase() + themeName.slice(1)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
