import { Injectable, signal, computed, inject } from '@angular/core';
import { FirebaseAuthService } from '../auth/providers/firebase-auth.service';
import { Observable, tap } from 'rxjs';

/**
 * Tenant Context Service
 *
 * Manages the current organization/tenant context for multi-tenant applications.
 * Stores organization ID in localStorage and provides reactive access via signals.
 *
 * Usage:
 * constructor(private tenantContext: TenantContextService) {}
 *
 * // Get current organization ID
 * const orgId = this.tenantContext.currentOrganizationId();
 *
 * // Switch organization
 * this.tenantContext.switchOrganization('org-123');
 *
 * // Clear organization
 * this.tenantContext.clearOrganization();
 */
@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private authService = inject(FirebaseAuthService);

  // Current organization ID signal
  private currentOrganizationIdSignal = signal<string | null>(null);

  // Computed signal for organization ID with fallback
  currentOrganizationId = computed(() => {
    return this.currentOrganizationIdSignal();
  });

  constructor() {
    this.initializeFromStorage();
    this.subscribeToUserOrgChanges();
  }

  /**
   * Initialize organization ID from localStorage
   */
  private initializeFromStorage(): void {
    const storedOrgId = localStorage.getItem('current_org_id');
    if (storedOrgId) {
      this.currentOrganizationIdSignal.set(storedOrgId);
    }
  }

  /**
   * Subscribe to user changes and update organization from custom claims
   */
  private subscribeToUserOrgChanges(): void {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user && user.organizationId) {
        this.currentOrganizationIdSignal.set(user.organizationId);
        localStorage.setItem('current_org_id', user.organizationId);
      } else {
        this.clearOrganization();
      }
    });
  }

  /**
   * Switch to a different organization
   * @param organizationId The organization ID to switch to
   */
  switchOrganization(organizationId: string): void {
    this.currentOrganizationIdSignal.set(organizationId);
    localStorage.setItem('current_org_id', organizationId);
  }

  /**
   * Clear the current organization context
   */
  clearOrganization(): void {
    this.currentOrganizationIdSignal.set(null);
    localStorage.removeItem('current_org_id');
  }

  /**
   * Get organization ID as observable
   */
  getOrganizationId(): Observable<string | null> {
    return new Observable((observer) => {
      observer.next(this.currentOrganizationIdSignal());
      this.authService
        .getCurrentUser()
        .pipe(
          tap((user) => {
            if (user?.organizationId) {
              observer.next(user.organizationId);
            } else {
              observer.next(null);
            }
          }),
        )
        .subscribe();
    });
  }

  /**
   * Check if user has organization context
   */
  hasOrganizationContext(): boolean {
    return this.currentOrganizationIdSignal() !== null;
  }
}
