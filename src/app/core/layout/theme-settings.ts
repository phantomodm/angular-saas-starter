import { Component, inject } from '@angular/core';

import { TenantSelectorComponent } from './tenant-selector';
import { BrandColorPickerComponent } from './brand-color-picker';
import { ThemeModeSelectorComponent } from './theme-mode-selector';
import { ThemePreview } from '../components/theme-preview';
import { ThemeService } from '../services/theme.service';
import { TenantThemeService } from '../services/tenant-theme.service';
import { Organization } from '../models/organization.model';

type Tenant = Organization;
@Component({
  selector: 'app-theme-settings',
  template: `
    <div class="space-y-10 p-6 max-w-3xl mx-auto">
      <app-tenant-selector [tenants]="tenants"></app-tenant-selector>

      <app-brand-color-picker></app-brand-color-picker>

      <app-theme-mode-selector></app-theme-mode-selector>

      <app-theme-preview></app-theme-preview>
    </div>
  `,
  imports: [
    TenantSelectorComponent,
    BrandColorPickerComponent,
    ThemeModeSelectorComponent,
    ThemePreview,
  ],
})
export class ThemeSettingsComponent {
  theme = inject(ThemeService);
  tenantTheme = inject(TenantThemeService);
  tenants: Tenant[] = [
    {
      id: 'acme',
      name: 'Acme Corp',
      company_name: 'Acme Corp',
      theme: {
        brandColor: '#ff5722',
        themePreference: 'dark',
      },
      status: 'active',
      roles: [],
      permissions: [],
      email: '',
      displayName: 'Acme Corp',
    },
    {
      id: 'nova',
      name: 'Nova Human',
      company_name: 'Nova Human',
      theme: {
        brandColor: '#0066ff',
        themePreference: 'system',
      },
      status: 'active',
      roles: [],
      permissions: [],
      email: '',
      displayName: 'Nova Human',
    },
  ];

  selectedTenant: Tenant | null = null;

  onTenantChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    const tenant = this.tenants.find((t) => t.id === id) || null;
    this.selectedTenant = tenant;

    if (tenant) {
      this.tenantTheme.applyTenantTheme(tenant);
    }
  }

  onBrandChange(event: Event) {
    const hex = (event.target as HTMLInputElement).value;
    this.theme.setBrandColor(hex);
  }
}
