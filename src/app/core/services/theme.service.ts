import { Injectable, signal, effect, inject } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

/**
 * ThemeService manages dark/light mode preference
 * Syncs with system preference and persists to localStorage
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'novahuman-theme-preference';
  private readonly SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

  // Signals
  theme = signal<Theme>(this.getStoredTheme());
  isDark = signal(this.getInitialDarkMode());

  constructor() {
    // Effect to update isDark when theme changes or system preference changes
    effect(() => {
      const currentTheme = this.theme();
      const isDarkMode = this.resolveIsDark(currentTheme);
      this.isDark.set(isDarkMode);
      this.applyTheme(isDarkMode);
    });

    // Listen for system theme changes
    this.watchSystemTheme();
  }

  /**
   * Get initially stored theme or default to 'system'
   */
  private getStoredTheme(): Theme {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // localStorage might not be available
    }
    return 'system';
  }

  /**
   * Get initial dark mode state
   */
  private getInitialDarkMode(): boolean {
    const stored = this.getStoredTheme();
    return this.resolveIsDark(stored);
  }

  /**
   * Resolve whether dark mode should be enabled
   */
  private resolveIsDark(theme: Theme): boolean {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    // 'system' - check system preference
    return this.getSystemPrefersDark();
  }

  /**
   * Check if system prefers dark mode
   */
  private getSystemPrefersDark(): boolean {
    try {
      return window.matchMedia(this.SYSTEM_DARK_QUERY).matches;
    } catch {
      return false;
    }
  }

  /**
   * Watch for system theme changes
   */
  private watchSystemTheme() {
    try {
      const mediaQuery = window.matchMedia(this.SYSTEM_DARK_QUERY);
      mediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
        if (this.theme() === 'system') {
          this.isDark.set(e.matches);
        }
      });
    } catch {
      // matchMedia not supported
    }
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(isDark: boolean) {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  /**
   * Set theme preference
   */
  setTheme(theme: Theme) {
    this.theme.set(theme);
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch {
      // localStorage might not be available
    }
  }

  /**
   * Toggle between light and dark (ignores 'system')
   */
  toggleTheme() {
    const current = this.theme();
    if (current === 'dark') {
      this.setTheme('light');
    } else {
      this.setTheme('dark');
    }
  }

  /**
   * Get current theme as readable string
   */
  getCurrentThemeLabel(): string {
    const theme = this.theme();
    if (theme === 'system') {
      return this.isDark() ? 'Dark (System)' : 'Light (System)';
    }
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }

  /**
   * Reset to system preference
   */
  resetToSystem() {
    this.setTheme('system');
  }
}
