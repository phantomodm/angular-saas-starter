import { Component, inject } from '@angular/core';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-theme-preview',
  templateUrl: './theme-preview.html',
})
export class ThemePreview {
  theme = inject(ThemeService);

  toggleTheme() {
    this.theme.toggleTheme();
  }

  resetToSystem() {
    this.theme.resetToSystem();
  }
}