import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthAdapter } from '../auth.adapter';
import { User, AuthCredentials, SignUpData, PasswordResetRequest, PasswordReset } from '../../models/user.model';

/**
 * Azure Active Directory Authentication Service
 * 
 * To use Azure AD in production:
 * 1. Install MSAL: npm install @azure/msal-browser @azure/msal-angular
 * 2. Register your application in Azure Portal
 * 3. Configure MSAL with your tenant ID and client ID
 * 4. Implement the AuthAdapter methods using MSAL SDK
 * 5. Update app.config.ts to use AzureAuthService instead of MockAuthService
 */
@Injectable()
export class AzureAdAuthService extends AuthAdapter {
  // TODO: Initialize MSAL
  // import { MsalAuthenticationService } from '@azure/msal-angular';
  // constructor(private authService: MsalAuthenticationService) {}

  login(credentials: AuthCredentials): Observable<{ user: User; token: string }> {
    throw new Error('Azure AD auth not implemented yet');
    // TODO: Implement using MSAL loginPopup or loginRedirect
  }

  signup(data: SignUpData): Observable<{ user: User; token: string }> {
    throw new Error('Azure AD auth not implemented yet');
    // TODO: Implement signup flow (usually redirects to Azure AD signup)
  }

  logout(): Observable<void> {
    throw new Error('Azure AD auth not implemented yet');
    // TODO: Implement using MSAL logout
  }

  getCurrentUser(): Observable<User | null> {
    throw new Error('Azure AD auth not implemented yet');
    // TODO: Get user from MSAL account info
  }

  refreshToken(): Observable<string> {
    throw new Error('Azure AD auth not implemented yet');
    // TODO: Implement token refresh
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<void> {
    throw new Error('Azure AD auth not implemented yet');
    // TODO: Implement password reset flow
  }

  resetPassword(data: PasswordReset): Observable<void> {
    throw new Error('Azure AD auth not implemented yet');
    // TODO: Implement password reset
  }

  verifyEmail(token: string): Observable<void> {
    throw new Error('Azure AD auth not implemented yet');
    // TODO: Implement email verification
  }

  isAuthenticated(): Observable<boolean> {
    throw new Error('Azure AD auth not implemented yet');
    // TODO: Check if user is authenticated
  }
}
