import { Injectable, computed, inject } from '@angular/core';
import { AuthStore } from '../../core/store/auth.store';

/**
 * UiAccessService provides reactive methods to check user roles and permissions.
 * Used for showing/hiding UI elements based on RBAC.
 */
@Injectable({ providedIn: 'root' })
export class UiAccessService {
  private authStore = inject(AuthStore);

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.authStore.roles().includes(role);
  }

  /**
   * Check if user has any of the provided roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.authStore.roles().includes(role));
  }

  /**
   * Check if user has all of the provided roles
   */
  hasAllRoles(roles: string[]): boolean {
    return roles.every((role) => this.authStore.roles().includes(role));
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this.authStore.permissions().includes(permission);
  }

  /**
   * Check if user has any of the provided permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.authStore.permissions().includes(permission));
  }

  /**
   * Check if user has all of the provided permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.authStore.permissions().includes(permission));
  }

  /**
   * Get user roles
   */
  getRoles() {
    return this.authStore.roles();
  }

  /**
   * Get user permissions
   */
  getPermissions() {
    return this.authStore.permissions();
  }
}
