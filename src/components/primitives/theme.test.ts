import { describe, expect, it, beforeEach } from 'vitest';
import { applyTheme, DEFAULT_THEME_MODE, readThemeMode, setThemeMode, toggleThemeMode } from './theme';

describe('theme mode', () => {
  const storage = new Map<string, string>();
  const testStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  };

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    storage.clear();
  });

  it('defaults to dark and respects persisted mode', () => {
    expect(readThemeMode(testStorage)).toBe(DEFAULT_THEME_MODE);
    testStorage.setItem('autonnel-theme-mode', 'light');
    expect(readThemeMode(testStorage)).toBe('light');
  });

  it('applies and persists a mode', () => {
    setThemeMode('light', testStorage, document);
    expect(testStorage.getItem('autonnel-theme-mode')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    applyTheme('dark', document);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggles between modes', () => {
    expect(toggleThemeMode('dark')).toBe('light');
    expect(toggleThemeMode('light')).toBe('dark');
  });
});
