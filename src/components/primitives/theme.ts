export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'autonnel-theme-mode';
export const DEFAULT_THEME_MODE: ThemeMode = 'dark';

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function readThemeMode(
  storage: Pick<Storage, 'getItem'> | null | undefined = typeof localStorage === 'undefined' ? null : localStorage,
  storageKey = THEME_STORAGE_KEY,
): ThemeMode {
  const stored = storage?.getItem(storageKey);
  return isThemeMode(stored) ? stored : DEFAULT_THEME_MODE;
}

export function applyTheme(mode: ThemeMode, document: Document = globalThis.document): void {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}

export function setThemeMode(
  mode: ThemeMode,
  storage: Pick<Storage, 'setItem'> | null | undefined = typeof localStorage === 'undefined' ? null : localStorage,
  document: Document | undefined = typeof globalThis.document === 'undefined' ? undefined : globalThis.document,
  storageKey = THEME_STORAGE_KEY,
): void {
  storage?.setItem(storageKey, mode);
  if (document) applyTheme(mode, document);
}

export function toggleThemeMode(mode: ThemeMode): ThemeMode {
  return mode === 'dark' ? 'light' : 'dark';
}

/** Inline script content used by layouts before the first paint. */
export const themeBootstrapScript = `
  (() => {
    const key = ${JSON.stringify(THEME_STORAGE_KEY)};
    const stored = window.localStorage.getItem(key);
    const mode = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  })();
`;
