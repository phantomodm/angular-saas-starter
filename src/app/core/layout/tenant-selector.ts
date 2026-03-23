import { Component, inject, Input } from '@angular/core';
import { TenantThemeService } from '../services/tenant-theme.service';
import { Organization } from '../models/organization.model';

type Tenant = Organization;

@Component({
  selector: 'app-tenant-selector',
  template: `<div class="space-y-2">
  <label class="text-sm font-medium text-on-surface">Tenant</label>

  <select class="input-field w-full" (change)="onChange($event)">
    <option value="">Select tenant…</option>
    @for(t of tenants; track t.id){
        <option  [value]="t.id">
      {{ t.name }}
    </option>
    }
    
  </select>
</div>`,
})
export class TenantSelectorComponent {
  @Input() tenants: Tenant[] = [];

  tenantTheme = inject(TenantThemeService);

  onChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    const tenant = this.tenants.find(t => t.id === id);
    if (tenant) {
      this.tenantTheme.applyTenantTheme(tenant);
    }
  }
}