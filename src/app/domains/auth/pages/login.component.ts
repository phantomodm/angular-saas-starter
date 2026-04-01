import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 dark:from-neutral-950 dark:to-neutral-900 px-4">
      <div class="w-full max-w-md">
        <!-- Logo & Title -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-4">
            F
          </div>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Welcome back</h1>
          <p class="text-neutral-600 dark:text-neutral-400 mt-2">Sign in to your account to continue</p>
        </div>
    
        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 space-y-6">
          <!-- Email Input -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              class="input-field"
              placeholder="you@example.com"
              required
              />
            </div>
    
            <!-- Password Input -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <a routerLink="/forgot-password" class="text-sm text-primary-600 hover:text-primary-700 dark:hover:text-primary-400">
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                class="input-field"
                placeholder="••••••••"
                required
                />
              </div>
    
              <!-- Error Message -->
              @if (authStore.error()) {
                <div class="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-200">
                  {{ authStore.error() }}
                </div>
              }
    
              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="authStore.loading()"
                class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                @if (!authStore.loading()) {
                  <span>Sign in</span>
                }
                @if (authStore.loading()) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-4 w-4" viewBox="0 0 50 50">
                      <circle class="opacity-30" cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" fill="none" />
                      <circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" fill="none" stroke-dasharray="100" stroke-dashoffset="75" />
                    </svg>
                    Signing in...
                  </span>
                }
              </button>
    
              <!-- Demo Accounts -->
              <div class="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 space-y-2">
                <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Demo Accounts:</p>
                <button
                  type="button"
                  (click)="useDemoAccount('admin@example.com', 'admin123')"
                  class="block w-full text-left px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                  >
                  👨‍💼 admin@example.com (admin)
                </button>
                <button
                  type="button"
                  (click)="useDemoAccount('user@example.com', 'user123')"
                  class="block w-full text-left px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                  >
                  👤 user@example.com (user)
                </button>
                <button
                  type="button"
                  (click)="useDemoAccount('developer@example.com', 'dev123')"
                  class="block w-full text-left px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                  >
                  👨‍💻 developer@example.com (dev)
                </button>
              </div>
            </form>
    
            <!-- Sign Up Link -->
            <p class="text-center text-neutral-600 dark:text-neutral-400 mt-6">
              Don't have an account?
              <a routerLink="/signup" class="text-primary-600 hover:text-primary-700 font-semibold dark:text-primary-400">
                Sign up
              </a>
            </p>
          </div>
        </div>
    `,
})
export class LoginComponent {
  authStore = inject(AuthStore);
  router = inject(Router);

  email = signal('');
  password = signal('');

  onSubmit() {
    this.authStore.clearError();
    this.authStore.login(this.email(), this.password());

    // Redirect on successful login
    setTimeout(() => {
      if (this.authStore.isAuthenticated()) {
        this.router.navigate(['/continuity']);
      }
    }, 600);
  }

  useDemoAccount(email: string, password: string) {
    this.email.set(email);
    this.password.set(password);
    setTimeout(() => this.onSubmit(), 100);
  }
}
