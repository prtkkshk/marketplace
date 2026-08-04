import React from 'react';
import { useTheme } from '../../lib/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-full border border-line bg-surface p-1">
      {(['light', 'system', 'dark'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`px-3 py-1 text-[13px] font-medium rounded-full transition-colors ${
            theme === t
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
