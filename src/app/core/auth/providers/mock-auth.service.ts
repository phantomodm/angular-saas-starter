import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import {
  AuthCredentials,
  SignUpData,
  PasswordResetRequest,
  PasswordReset,
} from '../../models/user.model';
import { Organization } from '../../models/organization.model';
import { AuthAdapter } from '../auth.adapter';

/**
 * Mock authentication service for demo and testing purposes.
 * In production, replace with actual provider (Firebase, AWS Cognito, etc.)
 */
@Injectable()
export class MockAuthService implements AuthAdapter {
  private mockUsers: Map<string, { user: Organization; password: string }> =
    new Map([
      [
        'admin@example.com',
        {
          user: {
            id: '1',
            name: 'Admin User',
            status: 'active',
            email: 'admin@example.com',
            company_name: 'Admin Company',
            displayName: 'Admin User',
            roles: ['admin', 'user'],
            permissions: [
              'user.manage',
              'role.assign',
              'permission.assign',
              'billing.manage',
              'analytics.view',
              'developer.manage',
              'api-key.create',
              'api-key.revoke',
            ],
            createdAt: new Date('2024-01-01'),
            lastLogin: new Date(),
          },
          password: 'admin123',
        },
      ],
      [
        'user@example.com',
        {
          user: {
            id: '2',
            name: 'Regular User',
            status: 'active',
            email: 'user@example.com',
            company_name: 'User Company',
            displayName: 'Regular User',
            roles: ['user'],
            permissions: [
              'analytics.view',
              'api-key.create',
              'api-key.view',
              'api-key.revoke',
              'billing.view',
            ],
            createdAt: new Date('2024-02-15'),
            lastLogin: new Date(),
          },
          password: 'user123',
        },
      ],
      [
        'developer@example.com',
        {
          user: {
            id: '3',
            name: 'Developer User',
            status: 'active',
            email: 'developer@example.com',
            company_name: 'Developer Company',
            displayName: 'Developer User',
            roles: ['developer', 'user'],
            permissions: [
              'developer.manage',
              'api-key.create',
              'api-key.view',
              'api-key.revoke',
              'analytics.view',
            ],
            createdAt: new Date('2024-03-10'),
            lastLogin: new Date(),
          },
          password: 'dev123',
        },
      ],
    ]);

  private currentUser: Organization | null = null;
  private authToken: string | null = null;

  login(
    credentials: AuthCredentials,
  ): Observable<{ user: Organization; token: string }> {
    return of(null).pipe(
      delay(500), // Simulate network delay
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      switchMap(() => {
        const userData = this.mockUsers.get(credentials.email);
        if (!userData || userData.password !== credentials.password) {
          return throwError(() => new Error('Invalid email or password'));
        }

        this.currentUser = userData.user;
        this.authToken = this.generateMockToken();
        return of({ user: userData.user, token: this.authToken });
      }),
    );
  }

  signup(data: SignUpData): Observable<{ user: Organization; token: string }> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        if (this.mockUsers.has(data.email)) {
          return throwError(() => new Error('Email already registered'));
        }

        const newUser: Organization = {
          id: Math.random().toString(36).substr(2, 9),
          email: data.email,
          company_name: data.displayName + ' Company',
          displayName: data.displayName,
          roles: ['user'],
          permissions: [
            'analytics.view',
            'api-key.create',
            'api-key.view',
            'billing.view',
          ],
          createdAt: new Date(),
          lastLogin: new Date(),
          name: data.displayName,
          status: 'active',
        };

        this.mockUsers.set(data.email, {
          user: newUser,
          password: data.password,
        });
        this.currentUser = newUser;
        this.authToken = this.generateMockToken();

        return of({ user: newUser, token: this.authToken });
      }),
    );
  }

  logout(): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tap(() => {
        this.currentUser = null;
        this.authToken = null;
      }),
    );
  }

  getCurrentUser(): Observable<Organization | null> {
    return of(this.currentUser).pipe(delay(100));
  }

  refreshToken(): Observable<string> {
    return of(this.generateMockToken()).pipe(
      delay(200),
      tap((token) => {
        this.authToken = token;
      }),
    );
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<void> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        if (!this.mockUsers.has(request.email)) {
          // Return success anyway for security (don't reveal which emails exist)
          return of(undefined);
        }
        return of(undefined);
      }),
    );
  }

  resetPassword(data: PasswordReset): Observable<void> {
    return of(undefined).pipe(
      delay(500),
      tap(() => {
        // In real implementation, validate token
      }),
    );
  }

  verifyEmail(token: string): Observable<void> {
    return of(undefined).pipe(delay(300));
  }

  isAuthenticated(): Observable<boolean> {
    return of(this.currentUser !== null && this.authToken !== null);
  }

  private generateMockToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Import tap and switchMap from rxjs
import { tap, switchMap } from 'rxjs/operators';
