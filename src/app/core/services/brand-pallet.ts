import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrandPaletteService {
  // This is conceptual: in practice, Material’s SCSS generates the palette
  // from `--brand-primary`. Here we just keep a hook if you want to inspect
  // or sync it elsewhere.
  getCurrentBrandColor(): string {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--brand-primary')
      .trim();
    return value || '#0066ff';
  }
}