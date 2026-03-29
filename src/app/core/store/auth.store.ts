import { Injectable, computed, inject, signal } from '@angular/core';
import { Organization } from '../models/organization.model';
import { AuthAdapter, AUTH_ADAPTER } from '../auth/auth.adapter';
import { Router } from '@angular/router';

/**
 * AuthStore manages authentication state using Angular signals.
 * Provides reactive auth state, computed signals for derived data, and effects for async operations.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private authAdapter = inject(AuthAdapter, { optional: false });
  private router = inject(Router);

  // State signals
  workspaceId = signal<string | null>('default');
  currentUser = signal<Organization | null>(null);
  isAuthenticated = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  initialized = signal(false);
  authToken = signal<string | null>(null);

  // Computed signals for derived state
  roles = computed(() => this.currentUser()?.roles ?? []);
  permissions = computed(() => this.currentUser()?.permissions ?? []);
  userEmail = computed(() => this.currentUser()?.email ?? '');
  userName = computed(() => this.currentUser()?.displayName ?? '');

  // Check if user is admin
  isAdmin = computed(() => this.roles().includes('admin'));

  // Check if user is developer
  isDeveloper = computed(() => this.roles().includes('developer'));

  constructor() {
    // Initialize auth state on app load
    this.initializeAuth();
  }

  /**
   * Initialize authentication - check if user is already logged in
   */
  private initializeAuth() {
    this.loading.set(true);

    this.authAdapter.getCurrentUser().subscribe({
      next: (user: Organization | null) => {
        if (user) {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        }
        this.initialized.set(true);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.initialized.set(true);
        this.loading.set(false);
      },
    });
  }

  /**
   * Login with credentials
   */
  login(email: string, password: string) {
    this.loading.set(true);
    this.error.set(null);

    this.authAdapter.login({ email, password }).subscribe({
      next: ({ user, token }: { user: Organization; token: string }) => {
        this.currentUser.set(user);
        this.workspaceId.set(user.organizationId || 'default');
        this.authToken.set(token);
        this.isAuthenticated.set(true);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Login failed');
        this.loading.set(false);
      },
    });
  }

  /**
   * Sign up new user
   */
  signup(email: string, password: string, displayName: string) {
    this.loading.set(true);
    this.error.set(null);

    this.authAdapter.signup({ email, password, displayName }).subscribe({
      next: ({ user, token }: { user: Organization; token: string }) => {
        this.currentUser.set(user);
        this.workspaceId.set(user.organizationId || 'default');
        this.authToken.set(token);
        this.isAuthenticated.set(true);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Sign up failed');
        this.loading.set(false);
      },
    });
  }

  /**
   * Logout current user
   */
  logout() {
    this.loading.set(true);
    this.authAdapter.logout().subscribe({
      next: () => {
        this.currentUser.set(null);
        this.authToken.set(null);
        this.workspaceId.set('default');
        this.isAuthenticated.set(false);
        this.error.set(null);
        this.loading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Logout failed');
        this.loading.set(false);
      },
    });
  }

  /**
   * Request password reset
   */
  requestPasswordReset(email: string) {
    this.loading.set(true);
    this.error.set(null);

    this.authAdapter.requestPasswordReset({ email }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to request password reset');
        this.loading.set(false);
      },
    });
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string) {
    this.loading.set(true);
    this.error.set(null);

    this.authAdapter.resetPassword({ token, newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to reset password');
        this.loading.set(false);
      },
    });
  }

  /**
   * Verify email with token
   */
  verifyEmail(token: string) {
    this.authAdapter.verifyEmail(token).subscribe({
      error: (err: Error) => {
        this.error.set(err.message || 'Email verification failed');
      },
    });
  }

  /**
   * Clear error message
   */
  clearError() {
    this.error.set(null);
  }
}
