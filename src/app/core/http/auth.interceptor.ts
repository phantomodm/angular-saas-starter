import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { FirebaseAuthService } from '../auth/providers/firebase-auth.service';
import { TenantContextService } from '../tenancy/tenant-context.service';
import { Router } from '@angular/router';

/**
 * HTTP Interceptor for Authentication
 *
 * Responsibilities:
 * 1. Attach Firebase token to all requests
 * 2. Attach organization ID header for multi-tenant requests
 * 3. Handle 401 responses with token refresh + retry
 * 4. Handle 403 responses (permission denied)
 * 5. Log errors and notify user
 *
 * Usage in app.config.ts:
 * provideHttpClient(withInterceptors([authInterceptor]))
 *
 * Or with class-based (recommended):
 * {
 *   provide: HTTP_INTERCEPTORS,
 *   useClass: AuthInterceptor,
 *   multi: true
 * }
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  // Counter to prevent infinite refresh loops
  private refreshAttempts = 0;
  private maxRefreshAttempts = 3;

  constructor(
    private authService: FirebaseAuthService,
    private tenantContext: TenantContextService,
    private router: Router,
  ) {}

  /**
   * Main intercept method - processes all HTTP requests/responses
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // Skip token attachment for public endpoints
    if (this.isPublicUrl(request.url)) {
      return next.handle(request);
    }

    // Add token and org ID to request
    return this.addTokenToRequest(request).pipe(
      switchMap((newRequest) => next.handle(newRequest)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        } else if (error.status === 403) {
          return this.handle403Error(error);
        }
        return throwError(() => error);
      }),
    );
  }

  /**
   * Add Firebase token and org ID to request headers
   */
  private addTokenToRequest(
    request: HttpRequest<any>,
  ): Observable<HttpRequest<any>> {
    return new Observable((subscriber) => {
      const token = this.authService.getTokenSync();

      if (!token) {
        subscriber.next(request);
        subscriber.complete();
        return;
      }

      // Check if token is expiring soon and refresh if needed
      if (this.authService.isTokenExpiring()) {
        this.authService.getToken(true).subscribe({
          next: (newToken) => {
            const modifiedRequest = this.attachTokenAndOrgId(request, newToken);
            subscriber.next(modifiedRequest);
            subscriber.complete();
          },
          error: () => {
            // If refresh fails, send original request with current token
            const modifiedRequest = this.attachTokenAndOrgId(request, token);
            subscriber.next(modifiedRequest);
            subscriber.complete();
          },
        });
      } else {
        // Token is still valid, use it as is
        const modifiedRequest = this.attachTokenAndOrgId(request, token);
        subscriber.next(modifiedRequest);
        subscriber.complete();
      }
    });
  }

  /**
   * Attach token and organization ID to request headers
   */
  private attachTokenAndOrgId(
    request: HttpRequest<any>,
    token: string | null,
  ): HttpRequest<any> {
    if (!token) {
      return request;
    }

    let modifiedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Add organization ID header if set and request is for org-scoped endpoint
    const orgId = this.tenantContext.currentOrganizationId();
    if (orgId && this.isOrgScopedUrl(request.url)) {
      modifiedRequest = modifiedRequest.clone({
        setHeaders: {
          'X-Organization-Id': orgId,
        },
      });
    }

    return modifiedRequest;
  }

  /**
   * Handle 401 Unauthorized responses
   * Attempts to refresh token and retry the request once
   */
  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshAttempts = 0;
      this.refreshTokenSubject.next(null);

      return this.authService.getToken(true).pipe(
        switchMap((token: string | null) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);

          if (!token) {
            // Token refresh failed, logout user
            this.handleAuthFailure();
            return throwError(() => new Error('Token refresh failed'));
          }

          // Retry the original request with new token
          return next.handle(this.attachTokenAndOrgId(request, token));
        }),
        catchError((error) => {
          this.isRefreshing = false;

          // If refresh fails multiple times, logout
          if (this.refreshAttempts++ >= this.maxRefreshAttempts) {
            this.handleAuthFailure();
          }

          return throwError(() => error);
        }),
        finalize(() => {
          this.isRefreshing = false;
        }),
      );
    } else {
      // Token refresh already in progress, wait for it
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          return next.handle(this.attachTokenAndOrgId(request, token || ''));
        }),
      );
    }
  }

  /**
   * Handle 403 Forbidden responses
   * User is authenticated but doesn't have permission
   */
  private handle403Error(error: HttpErrorResponse): Observable<never> {
    console.warn('Access forbidden:', error.error?.detail || error.message);

    // Could navigate to /unauthorized or show toast here
    // For now, just pass the error through
    return throwError(() => error);
  }

  /**
   * Handle authentication failures
   * Clears auth state and redirects to login
   */
  private handleAuthFailure(): void {
    console.error('Authentication failed, redirecting to login');
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  /**
   * Check if URL is a public endpoint (no auth required)
   */
  private isPublicUrl(url: string): boolean {
    const publicPaths = [
      '/health',
      '/auth/login',
      '/auth/signup',
      '/auth/forgot-password',
      '/docs',
      '/redoc',
      '/openapi.json',
    ];

    return publicPaths.some((path) => url.includes(path));
  }

  /**
   * Check if URL is organization-scoped
   * These URLs need X-Organization-Id header
   */
  private isOrgScopedUrl(url: string): boolean {
    return url.includes('/api/org/');
  }
}
