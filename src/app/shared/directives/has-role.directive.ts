import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { UiAccessService } from '../services/ui-access.service';

/**
 * Structural directive to show/hide elements based on user roles.
 *
 * Usage:
 * <div *hasRole="'admin'">Admin content</div>
 * <div *hasRole="['admin', 'moderator']">Admin or moderator content</div>
 */
@Directive({
  selector: '[hasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private uiAccessService = inject(UiAccessService);

  private roles: string[] = [];
  private requireAll = false;

  @Input()
  set hasRole(roles: string | string[]) {
    this.roles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  @Input()
  set hasRoleRequireAll(require: boolean) {
    this.requireAll = require;
    this.updateView();
  }

  private updateView(): void {
    const hasAccess = this.requireAll
      ? this.uiAccessService.hasAllRoles(this.roles)
      : this.uiAccessService.hasAnyRole(this.roles);

    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
