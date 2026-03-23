import { Injectable, inject } from '@angular/core';
import { ThemeService } from './theme.service';
import { Organization } from '../models/organization.model';

@Injectable({ providedIn: 'root' })
export class TenantThemeService {
  private theme = inject(ThemeService);

  applyTenantTheme(tenant: Organization) {
    
    // Brand color
    if (tenant.theme?.brandColor) {
      this.theme.setBrandColor(tenant.theme.brandColor);
    }

    // Light/dark/system
    if (tenant.theme?.themePreference) {
      this.theme.setTheme(tenant.theme.themePreference);
    }
  }
}