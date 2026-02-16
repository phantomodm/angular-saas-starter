import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 dark:from-neutral-950 dark:to-neutral-900 px-4">
      <div class="w-full max-w-md">
        <!-- Logo & Title -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-4">
            F
          </div>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Create account</h1>
          <p class="text-neutral-600 dark:text-neutral-400 mt-2">Join Fusion and start building</p>
        </div>

        <!-- Signup Form -->
        <form (ngSubmit)="onSubmit()" class="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 space-y-6">
          <!-- Name Input -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              [(ngModel)]="displayName"
              name="displayName"
              class="input-field"
              placeholder="John Doe"
              required
            />
          </div>

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
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Password
            </label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              class="input-field"
              placeholder="••••••••"
              required
            />
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              At least 8 characters recommended
            </p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              class="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <!-- Error Message -->
          <div *ngIf="authStore.error()" class="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-200">
            {{ authStore.error() }}
          </div>

          <!-- Password validation message -->
          <div *ngIf="passwordError()" class="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-200">
            {{ passwordError() }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="authStore.loading()"
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="!authStore.loading()">Create account</span>
            <span *ngIf="authStore.loading()" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 50 50">
                <circle class="opacity-30" cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" fill="none" />
                <circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" fill="none" stroke-dasharray="100" stroke-dashoffset="75" />
              </svg>
              Creating account...
            </span>
          </button>
        </form>

        <!-- Login Link -->
        <p class="text-center text-neutral-600 dark:text-neutral-400 mt-6">
          Already have an account?
          <a routerLink="/login" class="text-primary-600 hover:text-primary-700 font-semibold dark:text-primary-400">
            Sign in
          </a>
        </p>
      </div>
    </div>
  `,
})
export class SignupComponent {
  authStore = inject(AuthStore);
  router = inject(Router);

  displayName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  passwordError = signal('');

  onSubmit() {
    this.authStore.clearError();
    this.passwordError.set('');

    if (this.password() !== this.confirmPassword()) {
      this.passwordError.set('Passwords do not match');
      return;
    }

    if (this.password().length < 6) {
      this.passwordError.set('Password must be at least 6 characters');
      return;
    }

    this.authStore.signup(this.email(), this.password(), this.displayName());

    // Redirect on successful signup
    setTimeout(() => {
      if (this.authStore.isAuthenticated()) {
        this.router.navigate(['/dashboard']);
      }
    }, 600);
  }
}
