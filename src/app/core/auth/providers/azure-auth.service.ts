import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthAdapter } from '../auth.adapter';
import {
  AuthCredentials,
  SignUpData,
  PasswordResetRequest,
  PasswordReset,
} from '../../models/user.model';
import { Organization } from '../../models/organization.model';
/**
 * Azure Active Directory Authentication Service
 *
 * Implements the AuthAdapter interface using Microsoft Authentication Library (MSAL) for Browser.
 * This implementation uses interactive login flows for Azure AD B2C and Azure AD.
 *
 * Installation:
 * npm install @azure/msal-browser @azure/msal-angular
 *
 * Setup in main.ts or app config:
 * import { MsalModule, MsalInterceptor, MsalBroadcastService } from '@azure/msal-angular';
 * import { PublicClientApplication } from '@azure/msal-browser';
 *
 * const msalConfig = {
 *   auth: {
 *     clientId: 'YOUR_CLIENT_ID',
 *     authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
 *     redirectUri: window.location.origin,
 *   },
 * };
 *
 * Usage in app.config.ts:
 * {
 *   provide: AuthAdapter,
 *   useClass: AzureAdAuthService,
 * }
 */
@Injectable()
export class AzureAdAuthService extends AuthAdapter {
  private msalInstance: any; // PublicClientApplication instance
  private account: any = null;

  constructor() {
    super();
    this.initializeMsal();
  }

  /**
   * Initialize MSAL - PublicClientApplication should be provided via DI or created here
   */
  private initializeMsal() {
    try {
      // import { PublicClientApplication } from '@azure/msal-browser';
      // const msalConfig = {
      //   auth: {
      //     clientId: environment.azure.clientId,
      //     authority: environment.azure.authority,
      //     redirectUri: window.location.origin,
      //   },
      //   cache: {
      //     cacheLocation: 'sessionStorage',
      //     storeAuthStateInCookie: false,
      //   },
      // };
      // this.msalInstance = new PublicClientApplication(msalConfig);
      // await this.msalInstance.initialize();

      console.warn(
        'MSAL not initialized. Please configure MSAL in your environment.',
      );
    } catch (error) {
      console.error('Failed to initialize MSAL', error);
    }
  }

  login(
    credentials: AuthCredentials,
  ): Observable<{ user: Organization; token: string }> {
    if (!this.msalInstance) {
      return throwError(() => new Error('MSAL not initialized'));
    }

    // Implementation for Azure AD with username/password (Resource Owner Password Credentials flow)
    // Note: Interactive login (popup/redirect) is recommended for better security
    // return from(this.msalInstance.acquireTokenByUsernamePassword({
    //   scopes: ['User.Read'],
    //   username: credentials.email,
    //   password: credentials.password,
    // })).pipe(
    //   switchMap((response: any) => {
    //     return from(this.msalInstance.getActiveAccount()).pipe(
    //       map((account: any) => {
    //         this.account = account;
    //         return {
    //           user: this.mapAzureUserToAppUser(account),
    //           token: response.accessToken,
    //         };
    //       })
    //     );
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('MSAL not initialized'));
  }

  signup(data: SignUpData): Observable<{ user: Organization; token: string }> {
    if (!this.msalInstance) {
      return throwError(() => new Error('MSAL not initialized'));
    }

    // Azure AD typically doesn't support self-service signup in the SDK.
    // You would redirect to an Azure AD B2C signup policy or use your own signup endpoint.
    // Alternatively, use loginPopup and handle signup through Azure AD B2C policies.

    // return from(this.msalInstance.loginPopup({
    //   scopes: ['User.Read'],
    //   prompt: 'select_account', // or 'create' for signup in B2C
    // })).pipe(
    //   switchMap((response: any) => {
    //     this.account = response.account;
    //     return from(this.msalInstance.acquireTokenSilent({
    //       scopes: ['User.Read'],
    //       account: this.account,
    //     }));
    //   }),
    //   map((response: any) => ({
    //     user: this.mapAzureUserToAppUser(this.account),
    //     token: response.accessToken,
    //   })),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('MSAL not initialized'));
  }

  logout(): Observable<void> {
    if (!this.msalInstance) {
      return throwError(() => new Error('MSAL not initialized'));
    }

    // Implementation:
    // return from(this.msalInstance.logoutPopup({
    //   account: this.account,
    // })).pipe(
    //   tap(() => {
    //     this.account = null;
    //   }),
    //   map(() => undefined),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('MSAL not initialized'));
  }

  getCurrentUser(): Observable<Organization | null> {
    if (!this.msalInstance) {
      return of(null);
    }

    // Implementation:
    // try {
    //   const account = this.msalInstance.getActiveAccount();
    //   if (account) {
    //     this.account = account;
    //     return of(this.mapAzureUserToAppUser(account));
    //   }
    // } catch (error) {
    //   console.error('Error getting current user', error);
    // }

    return of(null);
  }

  refreshToken(): Observable<string> {
    if (!this.msalInstance || !this.account) {
      return throwError(() => new Error('Not authenticated'));
    }

    // Implementation:
    // return from(this.msalInstance.acquireTokenSilent({
    //   scopes: ['User.Read'],
    //   account: this.account,
    //   forceRefresh: true,
    // })).pipe(
    //   map((response: any) => response.accessToken),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('MSAL not initialized'));
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<void> {
    // Azure AD doesn't have built-in password reset through the SDK
    // Typically you would redirect to a custom password reset page or use Microsoft Graph API
    // return from(fetch(`https://graph.microsoft.com/v1.0/me/changePassword`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     currentPassword: '',
    //     newPassword: '',
    //   }),
    // })).pipe(
    //   map(() => undefined),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('MSAL not initialized'));
  }

  resetPassword(data: PasswordReset): Observable<void> {
    // Similar to above - Azure AD password reset is typically handled outside the app
    return throwError(
      () => new Error('Password reset not supported in Azure AD flow'),
    );
  }

  verifyEmail(token: string): Observable<void> {
    // Email verification is handled by Azure AD automatically upon signup
    return of(undefined);
  }

  isAuthenticated(): Observable<boolean> {
    if (!this.msalInstance) {
      return of(false);
    }

    // Implementation:
    // try {
    //   const account = this.msalInstance.getActiveAccount();
    //   return of(!!account);
    // } catch {
    //   return of(false);
    // }

    return of(false);
  }

  /**
   * Helper method to map Azure AD user to app Organization model
   */
  private mapAzureUserToAppUser(azureAccount: any): Organization {
    return {
      id: azureAccount.homeAccountId || azureAccount.localAccountId,
      name: azureAccount.name || 'User',
      status: 'active',
      email: azureAccount.username || azureAccount.mail || '',
      displayName: azureAccount.name || 'User',
      photoUrl: undefined, // Would need to fetch from Microsoft Graph
      roles: ['user'], // Fetch from Azure AD app roles
      permissions: [], // Fetch from Azure AD group memberships or custom claims
      createdAt: new Date(),
      lastLogin: new Date(),
      company_name: azureAccount.name || 'User',
    };
  }
}
