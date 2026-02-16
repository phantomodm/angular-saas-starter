import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { UiAccessService } from '../services/ui-access.service';

/**
 * Structural directive to show/hide elements based on user permissions.
 *
 * Usage:
 * <div *hasPermission="'billing.manage'">Billing management</div>
 * <div *hasPermission="['api-key.create', 'api-key.revoke']">API key controls</div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private uiAccessService = inject(UiAccessService);

  private permissions: string[] = [];
  private requireAll = false;

  @Input()
  set hasPermission(permissions: string | string[]) {
    this.permissions = Array.isArray(permissions) ? permissions : [permissions];
    this.updateView();
  }

  @Input()
  set hasPermissionRequireAll(require: boolean) {
    this.requireAll = require;
    this.updateView();
  }

  private updateView(): void {
    const hasAccess = this.requireAll
      ? this.uiAccessService.hasAllPermissions(this.permissions)
      : this.uiAccessService.hasAnyPermission(this.permissions);

    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
