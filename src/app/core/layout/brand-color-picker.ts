import { Component, inject } from '@angular/core';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-brand-color-picker',
  template: `
  <div class="space-y-3">
  <label class="block text-sm font-medium text-on-surface">
    Brand color
  </label>

  <div class="flex items-center gap-3">
    <input
      type="color"
      [value]="brandColor() ?? '#0066ff'"
      (input)="onColorChange($event)"
      class="h-10 w-10 rounded border border-neutral-300 cursor-pointer"
    />

    <span class="text-sm text-on-surface">
      {{ brandColor() ?? '#0066ff' }}
    </span>

    <button
      type="button"
      class="ml-auto px-3 py-1.5 text-xs rounded bg-surface-container text-on-surface"
      (click)="resetBrand()"
    >
      Reset
    </button>
  </div>
</div>
  `,
})
export class BrandColorPickerComponent {
  private theme = inject(ThemeService);

  brandColor = this.theme.brandColor; // signal<string | null>

  onColorChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.theme.setBrandColor(input.value);
    }
  }

  resetBrand() {
    this.theme.setBrandColor('#0066ff'); // your default
  }
}