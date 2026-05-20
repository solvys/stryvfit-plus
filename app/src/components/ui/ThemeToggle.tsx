'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export type ThemeMode = 'light' | 'dark';

export function usePersistedTheme(storageKey: string, initialTheme: ThemeMode = 'dark') {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  return [theme, setTheme] as const;
}

export function ThemeToggle({
  theme,
  onChange,
  className = '',
}: {
  theme: ThemeMode;
  onChange: (theme: ThemeMode) => void;
  className?: string;
}) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      aria-label={`${isDark ? 'Dark' : 'Light'} theme active. Switch to ${isDark ? 'light' : 'dark'} theme`}
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      className={`ios-pill group relative inline-flex h-7 w-12 items-center rounded-full bg-current/10 px-1 text-current transition active:scale-95 ${className}`.trim()}
    >
      <span className="absolute inset-0 rounded-full bg-current/0 transition-colors duration-200 group-hover:bg-current/5" />
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-current/18 shadow-[0_3px_10px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-out ${
          isDark ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
      <span className={`relative z-10 inline-flex h-5 w-5 items-center justify-center transition-transform duration-300 ease-out ${isDark ? 'translate-x-5' : 'translate-x-0'}`}>
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
