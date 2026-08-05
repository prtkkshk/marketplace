import React, { useEffect, useState } from 'react';
import { useTheme } from '../../lib/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  return (
    <div className="flex items-center rounded-full border border-line bg-surface p-1">
      {(['light', 'dark'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`px-3 py-1 text-[13px] font-medium rounded-full transition-colors ${
            resolvedTheme === t
              ? 'bg-ink text-paper'
              : 'text-ink-2 hover:text-ink'
          }`}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
};
