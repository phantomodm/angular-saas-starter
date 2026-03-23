import { Injectable, signal, effect, inject } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

/**
 * ThemeService manages dark/light mode preference
 * Syncs with system preference and persists to localStorage
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'novahuman-theme-preference';
  private readonly BRAND_KEY = 'novahuman-brand-color';
  private readonly SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

  theme = signal<Theme>(this.getStoredTheme());
  isDark = signal(this.getInitialDarkMode());
  brandColor = signal<string | null>(this.getStoredBrandColor());

  constructor() {
    // React to theme or brand changes
    effect(() => {
      const currentTheme = this.theme();
      const isDarkMode = this.resolveIsDark(currentTheme);
      this.isDark.set(isDarkMode);
      this.applyTheme(isDarkMode);

      const brand = this.brandColor();
      if (brand) {
        this.applyBrandColor(brand);
      }
    });

    this.watchSystemTheme();
  }

  // -------------------------------
  // BRAND COLOR
  // -------------------------------

  private getStoredBrandColor(): string | null {
    try {
      return localStorage.getItem(this.BRAND_KEY);
    } catch {
      return null;
    }
  }

  setBrandColor(hex: string) {
    this.brandColor.set(hex);
    try {
      localStorage.setItem(this.BRAND_KEY, hex);
    } catch {}
  }

  private applyBrandColor(hex: string) {
    document.documentElement.style.setProperty('--brand-primary', hex);
  }

  // -------------------------------
  // THEME (light/dark/system)
  // -------------------------------

  private getStoredTheme(): Theme {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {}
    return 'system';
  }

  private getInitialDarkMode(): boolean {
    return this.resolveIsDark(this.getStoredTheme());
  }

  private resolveIsDark(theme: Theme): boolean {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return this.getSystemPrefersDark();
  }

  private getSystemPrefersDark(): boolean {
    try {
      return window.matchMedia(this.SYSTEM_DARK_QUERY).matches;
    } catch {
      return false;
    }
  }

  private watchSystemTheme() {
    try {
      const mediaQuery = window.matchMedia(this.SYSTEM_DARK_QUERY);
      mediaQuery.addEventListener('change', (e) => {
        if (this.theme() === 'system') {
          this.isDark.set(e.matches);
        }
      });
    } catch {}
  }

  private applyTheme(isDark: boolean) {
    const html = document.documentElement;
    if (isDark) html.classList.add('dark');
    else html.classList.remove('dark');
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch {}
  }

  toggleTheme() {
    const current = this.theme();
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  }

  getCurrentThemeLabel(): string {
    const theme = this.theme();
    if (theme === 'system') {
      return this.isDark() ? 'Dark (System)' : 'Light (System)';
    }
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }

  resetToSystem() {
    this.setTheme('system');
  }
}