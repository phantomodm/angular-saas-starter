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
  templateUrl: './app-shell.component.html',
  
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
