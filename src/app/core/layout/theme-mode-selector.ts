import { Component, inject } from '@angular/core';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-theme-mode-selector',
  template: `<div class="space-y-2" >
  <label class="text-sm font-medium text-on-surface">Theme Mode</label>

  <div class="flex gap-3">
    <button class="btn-primary" (click)="theme.setTheme('light')">Light</button>
    <button class="btn-primary" (click)="theme.setTheme('dark')">Dark</button>
    <button class="btn-primary" (click)="theme.setTheme('system')">System</button>
  </div>

  <div class="text-xs opacity-70">
    Current: {{ theme.getCurrentThemeLabel() }}
  </div>
</div>`,
})
export class ThemeModeSelectorComponent {
  theme = inject(ThemeService);
}