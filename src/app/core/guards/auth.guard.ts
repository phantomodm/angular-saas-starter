import { Injectable, inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthStore } from '../store/auth.store';
import { FirebaseAuthService } from '../auth/providers/firebase-auth.service';
import { map, catchError } from 'rxjs/operators';
import { firstValueFrom, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  constructor(
    private authStore: AuthStore,
    private authService: FirebaseAuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean> {
    // Check if authenticated using signal value
    if (this.authStore.isAuthenticated()) {
      return Promise.resolve(true);
    }

    // If not authenticated, check with Firebase service
    return firstValueFrom(this.authService
      .getCurrentUser()
      .pipe(
        map((user) => {
          if (user) {
            this.authStore.currentUser.set(user);
            this.authStore.isAuthenticated.set(true);
            return true;
          }
          // Not authenticated, redirect to login
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url },
          });
          return false;
        }),
        catchError(() => {
          // Error checking auth, redirect to login
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url },
          });
          return of(false);
        })
      ));
  }
}

/**
 * Auth guard using Angular's new functional guard API
 * Protects routes that require authentication
 *
 * Usage: canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authGuardService = inject(AuthGuardService);
  return authGuardService.canActivate(route, state);
};
