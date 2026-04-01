import { Component, signal, inject } from '@angular/core';

import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../store/auth.store';
import { ThemeService } from '../services/theme.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  requiredRole?: string;
  requiredPermission?: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    HasRoleDirective,
    HasPermissionDirective,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    CommonModule
],
  template: `
    <!-- Header -->
    <header class="bg-white border-b border-neutral-200 sticky top-0 z-40 dark:bg-neutral-900 dark:border-neutral-800">
      <div class="flex items-center justify-between px-4 sm:px-6 py-4">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
            F
          </div>
          <span class="text-xl font-bold text-neutral-900 dark:text-neutral-50">Fusion</span>
        </div>

        <!-- Navigation (hidden on mobile) -->
        <nav class="hidden md:flex items-center gap-8">
          <a routerLink="/dashboard" routerLinkActive="font-semibold text-primary-600"
            class="text-neutral-600 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:text-neutral-50">
            Dashboard
          </a>
          <a routerLink="/billing" routerLinkActive="font-semibold text-primary-600"
            class="text-neutral-600 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:text-neutral-50">
            Billing
          </a>
          <a routerLink="/analytics" routerLinkActive="font-semibold text-primary-600"
            class="text-neutral-600 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:text-neutral-50">
            Analytics
          </a>
          <a *hasRole="'admin'" routerLink="/admin" routerLinkActive="font-semibold text-primary-600"
            class="text-neutral-600 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:text-neutral-50">
            Admin
          </a>
          <a *hasPermission="'developer.manage'" routerLink="/developer" routerLinkActive="font-semibold text-primary-600"
            class="text-neutral-600 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:text-neutral-50">
            Developer
          </a>
        </nav>

        <!-- User menu & mobile hamburger -->
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Notifications bell -->
          <button class="relative text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="absolute top-0 right-0 w-2 h-2 bg-danger-600 rounded-full"></span>
          </button>

          <!-- Theme toggle -->
          <button
            (click)="themeService.toggleTheme()"
            [title]="'Current: ' + themeService.getCurrentThemeLabel()"
            class="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 transition-colors"
          >
            <svg *ngIf="!themeService.isDark()" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg *ngIf="themeService.isDark()" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <!-- Mobile menu toggle (visible only on small screens) -->
          <button (click)="toggleMobileMenu()" class="md:hidden text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50">
            <svg *ngIf="!showMobileMenu()" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg *ngIf="showMobileMenu()" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- User dropdown -->
          <button (click)="toggleUserMenu()" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div class="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 font-semibold dark:bg-primary-900 dark:text-primary-200 text-sm">
              {{ authStore.userName().charAt(0).toUpperCase() }}
            </div>
            <span class="hidden sm:inline text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {{ authStore.userName() }}
            </span>
          </button>

          <!-- User menu dropdown -->
          <div *ngIf="showUserMenu()" class="absolute top-16 right-4 sm:right-6 bg-white border border-neutral-200 rounded-lg shadow-lg dark:bg-neutral-900 dark:border-neutral-800 w-48 py-2 z-50">
            <a routerLink="/account" (click)="closeAllMenus()" class="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
              Account Settings
            </a>
            <button (click)="logout()" class="w-full text-left px-4 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
              Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <div *ngIf="showMobileMenu()" class="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 animate-fade-in">
        <nav class="flex flex-col px-4 py-2 space-y-1">
          <a routerLink="/dashboard" routerLinkActive="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-semibold"
            (click)="closeMobileMenu()"
            class="block px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800">
            Dashboard
          </a>
          <a routerLink="/billing" routerLinkActive="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-semibold"
            (click)="closeMobileMenu()"
            class="block px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800">
            Billing
          </a>
          <a routerLink="/projects" routerLinkActive="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-semibold"
            (click)="closeMobileMenu()"
            class="block px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800">
            Projects
          </a>
          <a routerLink="/analytics" routerLinkActive="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-semibold"
            (click)="closeMobileMenu()"
            class="block px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800">
            Analytics
          </a>
          <a *hasRole="'admin'" routerLink="/admin" routerLinkActive="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-semibold"
            (click)="closeMobileMenu()"
            class="block px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800">
            Admin
          </a>
          <a *hasPermission="'developer.manage'" routerLink="/developer" routerLinkActive="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-semibold"
            (click)="closeMobileMenu()"
            class="block px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800">
            Developer
          </a>
        </nav>
      </div>
    </header>

    <!-- Main content area -->
    <main class="flex-1 overflow-auto">
      <!-- Breadcrumbs -->
      <div class="border-b border-neutral-200 bg-neutral-50 px-6 py-3 dark:bg-neutral-900 dark:border-neutral-800">
        <nav class="flex gap-2 text-sm text-muted">
          <a routerLink="/dashboard" class="hover:text-neutral-700 dark:hover:text-neutral-300">Dashboard</a>
          <span>/</span>
          <span class="text-neutral-900 dark:text-neutral-50">Current Page</span>
        </nav>
      </div>

      <!-- Page content -->
      <div class="p-6">
        <router-outlet></router-outlet>
      </div>
    </main> 
  `
  
})
export class AppShellComponent {
  private router = inject(Router);
  authStore = inject(AuthStore);
  themeService = inject(ThemeService);
  showUserMenu = signal(false);
  showMobileMenu = signal(false);
  isLandingPage = signal(true);
  // isLandingPage = toSignal(
  //   this.router.events.pipe(
  //     filter((event) => event instanceof NavigationEnd),
  //     map(() => this.router.url === '/landing')
  //   ),{ initialValue: false}
  // )

  workspaceId = this.authStore.workspaceId;

  isMobile() {
    return window.innerWidth < 768;
  }

  toggleUserMenu() {
    this.showUserMenu.update((v) => !v);
  }

  toggleMobileMenu() {
    this.showMobileMenu.update((v) => !v);
  }

  closeMobileMenu() {
    this.showMobileMenu.set(false);
  }

  closeAllMenus() {
    this.showUserMenu.set(false);
    this.showMobileMenu.set(false);
  }

  logout() {
    this.authStore.logout();
    this.closeAllMenus();
  }
}
