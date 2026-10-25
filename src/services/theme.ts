export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'l7a4eg_theme';

/**
 * Get current theme preference.
 * Defaults to 'light' (warm Mauritanian desert sand mode).
 */
export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch (e) {
    console.error('Failed to read theme from localStorage', e);
  }
  return 'light'; // Default to warm sand mode per user requirement
}

/**
 * Apply theme to document root element and persist in localStorage
 */
export function applyTheme(theme: ThemeMode): void {
  try {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme to localStorage', e);
  }
}
