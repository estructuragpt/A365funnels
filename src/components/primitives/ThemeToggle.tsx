import { useEffect, useState } from 'react';
import { applyTheme, DEFAULT_THEME_MODE, readThemeMode, setThemeMode, toggleThemeMode, type ThemeMode } from './theme';

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_THEME_MODE);

  useEffect(() => {
    const current = readThemeMode();
    setMode(current);
    applyTheme(current);
  }, []);

  const nextMode = toggleThemeMode(mode);
  const label = nextMode === 'dark' ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <button
      type="button"
      onClick={() => {
        setThemeMode(nextMode);
        setMode(nextMode);
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ds-muted hover:bg-ds-surface2 hover:text-ds-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-1"
      aria-label={label}
      title={label}
    >
      {mode === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
          <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
        </svg>
      )}
    </button>
  );
}
