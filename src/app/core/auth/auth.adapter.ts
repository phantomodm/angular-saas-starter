import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthCredentials, SignUpData, PasswordResetRequest, PasswordReset } from '../models/user.model';
import { Organization } from '../models/organization.model';
/**
 * AuthAdapter defines the contract that all authentication providers must implement.
 * This allows for pluggable authentication backends (Firebase, AWS Cognito, Azure AD, Supabase, etc.)
 */
export abstract class AuthAdapter {
  /**
   * Authenticate user with email and password
   */
  abstract login(credentials: AuthCredentials): Observable<{ user: Organization; token: string }>;

  /**
   * Register a new user
   */
  abstract signup(data: SignUpData): Observable<{ user: Organization; token: string }>;

  /**
   * Sign out current user
   */
  abstract logout(): Observable<void>;

  /**
   * Get currently authenticated user
   */
  abstract getCurrentUser(): Observable<Organization | null>;

  /**
   * Refresh authentication token
   */
  abstract refreshToken(): Observable<string>;

  /**
   * Request password reset email
   */
  abstract requestPasswordReset(request: PasswordResetRequest): Observable<void>;

  /**
   * Reset password with token
   */
  abstract resetPassword(data: PasswordReset): Observable<void>;

  /**
   * Verify email token
   */
  abstract verifyEmail(token: string): Observable<void>;

  /**
   * Check if user is currently authenticated
   */
  abstract isAuthenticated(): Observable<boolean>;
}

export const AUTH_ADAPTER = new InjectionToken<AuthAdapter>('AuthAdapter');
