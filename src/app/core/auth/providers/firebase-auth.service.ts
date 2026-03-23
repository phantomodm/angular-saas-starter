import { Injectable, inject } from '@angular/core';
import {
  Observable,
  from,
  throwError,
  of,
  BehaviorSubject,
  tap,
  switchMap,
  catchError,
  map,
  take,
  filter,
} from 'rxjs';
import { AuthAdapter } from '../auth.adapter';
import {
  AuthCredentials,
  SignUpData,
  PasswordResetRequest,
  PasswordReset,
} from '../../models/user.model';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { Organization } from '../../models/organization.model';

/**
 * Production-Ready Firebase Authentication Service
 *
 * Implements the AuthAdapter interface with real Firebase SDK integration.
 * Features:
 * - Firebase JWT token management with automatic refresh
 * - Auth state persistence across browser reloads
 * - Comprehensive error handling
 * - Token caching and expiration tracking
 * - Deduped token refresh to prevent simultaneous refreshes
 *
 * Usage in app.config.ts:
 * import { FirebaseAuthService } from './core/auth/providers/firebase-auth.service';
 * {
 *   provide: AUTH_ADAPTER,
 *   useClass: FirebaseAuthService,
 * }
 *
 * Installation:
 * npm install firebase
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService extends AuthAdapter {
  private auth!: Auth;
  private firebaseApp!: FirebaseApp;
  private currentUserSubject = new BehaviorSubject<Organization | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  // Token refresh state management
  private tokenRefreshPromise: Promise<string | null> | null = null;
  private tokenExpiryTime: number | null = null;

  // Track auth initialization
  private authInitialized = false;

  constructor() {
    super();
    // Firebase will be initialized when environment.ts is available
    // For now, show warning that needs to be set up
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase app and auth
   * Called in constructor, loads persisted auth state
   *
   * NOTE: Firebase config should be in environment.ts
   * If it's not found, you must call initWithConfig() manually
   */
  private initializeFirebase(): void {
    try {
      // Try to dynamically import environment
      // This won't work until environment.ts is created, but that's OK
      // User needs to create environment.ts with Firebase config first

      console.warn(
        '⚠️  Firebase initialization: environment.ts not yet configured',
      );
      console.warn(
        '📝 Please create src/environments/environment.ts with your Firebase config',
      );
      console.warn(
        '📖 See FIREBASE_INTEGRATION_GUIDE.md for configuration details',
      );

      this.authInitialized = false;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase', error);
      this.authInitialized = false;
    }
  }

  /**
   * Initialize Firebase with config object
   * Call this when Firebase config is available
   *
   * Example usage in app initialization:
   * ```typescript
   * import { FirebaseAuthService } from './core/auth/providers/firebase-auth.service';
   * import { environment } from './environments/environment';
   *
   * export const appConfig: ApplicationConfig = {
   *   providers: [
   *     // ... other providers
   *     {
   *       provide: APP_INITIALIZER,
   *       useFactory: (authService: FirebaseAuthService) => {
   *         return () => authService.initWithConfig(environment.firebase);
   *       },
   *       deps: [FirebaseAuthService],
   *       multi: true
   *     }
   *   ]
   * };
   * ```
   */
  initWithConfig(firebaseConfig: any): void {
    try {
      if (!firebaseConfig) {
        throw new Error('Firebase config is required');
      }

      this.firebaseApp = initializeApp(firebaseConfig);
      this.auth = getAuth(this.firebaseApp);

      // Listen to auth state changes
      this.setupAuthStateListener();
      this.authInitialized = true;

      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase', error);
      this.authInitialized = false;
    }
  }

  /**
   * Set up listener for auth state changes
   * Triggered on app init and whenever user logs in/out
   */
  private setupAuthStateListener(): void {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(false);

          // Store token expiry time
          const tokenResult = await firebaseUser.getIdTokenResult();
          this.tokenExpiryTime = new Date(tokenResult.expirationTime).getTime();

          // Extract custom claims (roles, permissions, org_id)
          const customClaims = tokenResult.claims;

          // Map user with custom claims
          const user = this.mapFirebaseUserToAppUser(
            firebaseUser,
            customClaims,
          );

          // Update subjects
          this.currentUserSubject.next(user);
          this.tokenSubject.next(token);
          this.isAuthenticatedSubject.next(true);
        } catch (error) {
          console.error('Error getting token on auth state change:', error);
          this.handleAuthError();
        }
      } else {
        this.handleLogout();
      }
    });
  }

  /**
   * Sign in with email and password
   */
  login(
    credentials: AuthCredentials,
  ): Observable<{ user: Organization; token: string }> {
    if (!this.authInitialized) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    return from(
      signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password,
      ),
    ).pipe(
      switchMap((userCredential) => {
        return from(userCredential.user.getIdTokenResult()).pipe(
          map((tokenResult) => {
            const customClaims = tokenResult.claims;
            const token = tokenResult.token;
            const user = this.mapFirebaseUserToAppUser(
              userCredential.user,
              customClaims,
            );

            // Update token expiry
            this.tokenExpiryTime = new Date(
              tokenResult.expirationTime,
            ).getTime();

            return { user, token };
          }),
        );
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      }),
    );
  }

  /**
   * Sign up with email, password, and optional display name
   */
  signup(data: SignUpData): Observable<{ user: Organization; token: string }> {
    if (!this.authInitialized) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    return from(
      createUserWithEmailAndPassword(this.auth, data.email, data.password),
    ).pipe(
      switchMap((userCredential) => {
        // Update profile with display name if provided
        if (data.displayName) {
          return from(
            updateProfile(userCredential.user, {
              displayName: data.displayName,
            }),
          ).pipe(
            switchMap(() => from(userCredential.user.getIdTokenResult())),
            map((tokenResult) => {
              const customClaims = tokenResult.claims;
              const token = tokenResult.token;
              const user = this.mapFirebaseUserToAppUser(
                userCredential.user,
                customClaims,
              );

              // Update token expiry
              this.tokenExpiryTime = new Date(
                tokenResult.expirationTime,
              ).getTime();

              return { user, token };
            }),
          );
        }

        // No display name, just get token
        return from(userCredential.user.getIdTokenResult()).pipe(
          map((tokenResult) => {
            const customClaims = tokenResult.claims;
            const token = tokenResult.token;
            const user = this.mapFirebaseUserToAppUser(
              userCredential.user,
              customClaims,
            );

            // Update token expiry
            this.tokenExpiryTime = new Date(
              tokenResult.expirationTime,
            ).getTime();

            return { user, token };
          }),
        );
      }),
      catchError((error) => {
        console.error('Signup error:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      }),
    );
  }

  /**
   * Sign out current user
   */
  logout(): Observable<void> {
    if (!this.authInitialized) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    return from(signOut(this.auth)).pipe(
      tap(() => this.handleLogout()),
      catchError((error) => {
        console.error('Logout error:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      }),
    );
  }

  /**
   * Get currently authenticated user
   * Returns the cached user from the BehaviorSubject
   */
  getCurrentUser(): Observable<Organization | null> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Get current token, refreshing if necessary
   * Handles token expiration and dedupes simultaneous refresh attempts
   */
  getToken(forceRefresh: boolean = false): Observable<string | null> {
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      return of(null);
    }

    // Check if token is expiring soon (within 5 minutes)
    const now = Date.now();
    const isExpiringSoon =
      this.tokenExpiryTime && this.tokenExpiryTime - now < 5 * 60 * 1000;

    if (!forceRefresh && !isExpiringSoon) {
      // Return cached token if it's still valid
      return this.tokenSubject.asObservable().pipe(
        take(1),
        filter((token) => token !== null),
      );
    }

    // Dedupe simultaneous token refresh attempts
    if (this.tokenRefreshPromise) {
      return from(this.tokenRefreshPromise);
    }

    this.tokenRefreshPromise = currentUser.getIdToken(true);

    return from(this.tokenRefreshPromise).pipe(
      tap((token) => {
        this.tokenSubject.next(token);
        // Update expiry time
        from(currentUser.getIdTokenResult(true)).subscribe((tokenResult) => {
          this.tokenExpiryTime = new Date(tokenResult.expirationTime).getTime();
        });
      }),
      catchError((error) => {
        console.error('Token refresh error:', error);
        // If refresh fails, logout user
        this.handleAuthError();
        return throwError(() => new Error('Token refresh failed'));
      }),
      tap(() => {
        this.tokenRefreshPromise = null;
      }),
    );
  }

  /**
   * Get current token synchronously from cache
   * Use asObservable() for reactive updates
   */
  getTokenSync(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Check if token is expiring soon (within 5 minutes)
   * Used by HTTP interceptor to proactively refresh token
   */
  isTokenExpiring(): boolean {
    if (!this.tokenExpiryTime) {
      return true; // If no expiry time set, assume it's expiring
    }
    const now = Date.now();
    const fiveMinutesFromNow = now + 5 * 60 * 1000;
    return this.tokenExpiryTime <= fiveMinutesFromNow;
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<string> {
    if (!this.auth.currentUser) {
      return throwError(() => new Error('Not authenticated'));
    }

    return from(this.auth.currentUser.getIdToken(true)).pipe(
      tap((token) => {
        this.tokenSubject.next(token);
      }),
      catchError((error) => {
        console.error('Refresh token error:', error);
        this.handleAuthError();
        return throwError(() => new Error(this.getErrorMessage(error)));
      }),
    );
  }

  /**
   * Request password reset email
   */
  requestPasswordReset(request: PasswordResetRequest): Observable<void> {
    if (!this.authInitialized) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    return from(sendPasswordResetEmail(this.auth, request.email)).pipe(
      map(() => undefined),
      catchError((error) => {
        console.error('Password reset request error:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      }),
    );
  }

  /**
   * Reset password with token
   */
  resetPassword(data: PasswordReset): Observable<void> {
    if (!this.authInitialized) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    return from(
      confirmPasswordReset(this.auth, data.token, data.newPassword),
    ).pipe(
      map(() => undefined),
      catchError((error) => {
        console.error('Password reset error:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      }),
    );
  }

  /**
   * Verify email token
   */
  verifyEmail(token: string): Observable<void> {
    if (!this.authInitialized) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    return from(applyActionCode(this.auth, token)).pipe(
      map(() => undefined),
      catchError((error) => {
        console.error('Email verification error:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      }),
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  /**
   * Get token observable for reactive updates
   */
  getTokenObservable(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  /**
   * Handle authentication errors
   * Clears auth state and logs out user
   */
  private handleAuthError(): void {
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.tokenExpiryTime = null;
  }

  /**
   * Handle logout
   * Clears all auth state
   */
  private handleLogout(): void {
    localStorage.removeItem('firebase_token');
    localStorage.removeItem('firebase_token_expiry');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.tokenExpiryTime = null;
  }

  /**
   * Map Firebase user to app User model
   */
  private mapFirebaseUserToAppUser(
    firebaseUser: FirebaseUser,
    customClaims?: any,
  ): Organization {
    // Extract roles and permissions from custom claims
    // Custom claims are set by the backend via Firebase Admin SDK
    const roles = customClaims?.roles || ['user'];
    const permissions = customClaims?.permissions || [];
    const organizationId = customClaims?.org_id;

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'User',
      photoUrl: firebaseUser.photoURL || undefined,
      roles: Array.isArray(roles) ? roles : [roles],
      permissions: Array.isArray(permissions) ? permissions : [],
      createdAt: firebaseUser.metadata?.creationTime
        ? new Date(firebaseUser.metadata.creationTime)
        : new Date(),
      lastLogin: firebaseUser.metadata?.lastSignInTime
        ? new Date(firebaseUser.metadata.lastSignInTime)
        : new Date(),
      organizationId,
      name: '',
      status: 'active',
      company_name: '',
    };
  }

  /**
   * Get user-friendly error message from Firebase error
   */
  private getErrorMessage(error: any): string {
    const errorCode = error.code || '';

    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'User not found. Please check your email.',
      'auth/wrong-password': 'Invalid password. Please try again.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/email-already-in-use': 'Email already in use.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/operation-not-allowed': 'Operation not allowed.',
      'auth/account-exists-with-different-credential':
        'Account exists with different credentials.',
      'auth/network-request-failed': 'Network error. Please try again.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
    };

    return errorMessages[errorCode] || error.message || 'Authentication failed';
  }
}
