import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '../store/auth.store';

@Injectable({ providedIn: 'root' })
export class PermissionGuardService {
  constructor(
    private authStore: AuthStore,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredPermissions = route.data['permissions'] as string[];

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions = this.authStore.permissions();
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}

/**
 * Permission guard using Angular's new functional guard API
 * Protects routes based on user permissions
 * Usage in routes: { path: 'billing', component: BillingComponent, canActivate: [permissionGuard], data: { permissions: ['billing.manage'] } }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const permissionGuardService = inject(PermissionGuardService);
  return permissionGuardService.canActivate(route, state);
};
