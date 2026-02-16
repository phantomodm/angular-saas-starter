import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthAdapter } from '../auth.adapter';
import { User, AuthCredentials, SignUpData, PasswordResetRequest, PasswordReset } from '../../models/user.model';

/**
 * Firebase Authentication Service
 *
 * Implements the AuthAdapter interface using Firebase SDK.
 * Make sure to initialize Firebase in your environment before using this service.
 *
 * Installation:
 * npm install firebase
 *
 * Usage in app.config.ts:
 * import { FirebaseAuthService } from './core/auth/providers/firebase-auth.service';
 * {
 *   provide: AuthAdapter,
 *   useClass: FirebaseAuthService,
 * }
 */
@Injectable()
export class FirebaseAuthService extends AuthAdapter {
  private auth: any; // Firebase Auth instance
  private firebaseUser: User | null = null;

  constructor() {
    super();
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase - should be called once on app startup
   * Set the auth property from your Firebase app initialization
   */
  private initializeFirebase() {
    try {
      // Import Firebase modules in your environment/main.ts:
      // import { initializeApp } from 'firebase/app';
      // import { getAuth } from 'firebase/auth';
      // import { environment } from './environments/environment';
      //
      // const firebaseApp = initializeApp(environment.firebase);
      // this.auth = getAuth(firebaseApp);

      // For now, this is a placeholder. You'll need to provide the Firebase auth instance
      // via dependency injection or service initialization
      console.warn('Firebase auth not initialized. Please set up Firebase in your environment.');
    } catch (error) {
      console.error('Failed to initialize Firebase', error);
    }
  }

  login(credentials: AuthCredentials): Observable<{ user: User; token: string }> {
    if (!this.auth) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    // Implementation:
    // import { signInWithEmailAndPassword } from 'firebase/auth';
    // return from(signInWithEmailAndPassword(this.auth, credentials.email, credentials.password)).pipe(
    //   switchMap((userCredential) => {
    //     return from(userCredential.user.getIdToken()).pipe(
    //       map((token) => ({
    //         user: this.mapFirebaseUserToAppUser(userCredential.user),
    //         token,
    //       }))
    //     );
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Firebase auth not initialized'));
  }

  signup(data: SignUpData): Observable<{ user: User; token: string }> {
    if (!this.auth) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    // Implementation:
    // import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
    // return from(createUserWithEmailAndPassword(this.auth, data.email, data.password)).pipe(
    //   switchMap((userCredential) => {
    //     return from(updateProfile(userCredential.user, { displayName: data.displayName })).pipe(
    //       switchMap(() => from(userCredential.user.getIdToken())),
    //       map((token) => ({
    //         user: this.mapFirebaseUserToAppUser(userCredential.user),
    //         token,
    //       }))
    //     );
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Firebase auth not initialized'));
  }

  logout(): Observable<void> {
    if (!this.auth) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    // Implementation:
    // import { signOut } from 'firebase/auth';
    // return from(signOut(this.auth)).pipe(
    //   tap(() => {
    //     this.firebaseUser = null;
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Firebase auth not initialized'));
  }

  getCurrentUser(): Observable<User | null> {
    if (!this.auth) {
      return of(null);
    }

    // Implementation:
    // return new Observable((subscriber) => {
    //   import { onAuthStateChanged } from 'firebase/auth';
    //   const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
    //     if (firebaseUser) {
    //       this.firebaseUser = this.mapFirebaseUserToAppUser(firebaseUser);
    //       subscriber.next(this.firebaseUser);
    //     } else {
    //       this.firebaseUser = null;
    //       subscriber.next(null);
    //     }
    //     subscriber.complete();
    //   });
    //   return () => unsubscribe();
    // });

    return of(null);
  }

  refreshToken(): Observable<string> {
    if (!this.auth || !this.auth.currentUser) {
      return throwError(() => new Error('Not authenticated'));
    }

    // Implementation:
    // return from(this.auth.currentUser.getIdToken(true)).pipe(
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Firebase auth not initialized'));
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<void> {
    if (!this.auth) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    // Implementation:
    // import { sendPasswordResetEmail } from 'firebase/auth';
    // return from(sendPasswordResetEmail(this.auth, request.email)).pipe(
    //   map(() => undefined),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Firebase auth not initialized'));
  }

  resetPassword(data: PasswordReset): Observable<void> {
    if (!this.auth) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    // Implementation:
    // import { confirmPasswordReset } from 'firebase/auth';
    // return from(confirmPasswordReset(this.auth, data.token, data.newPassword)).pipe(
    //   map(() => undefined),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Firebase auth not initialized'));
  }

  verifyEmail(token: string): Observable<void> {
    if (!this.auth) {
      return throwError(() => new Error('Firebase not initialized'));
    }

    // Implementation:
    // import { applyActionCode } from 'firebase/auth';
    // return from(applyActionCode(this.auth, token)).pipe(
    //   map(() => undefined),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Firebase auth not initialized'));
  }

  isAuthenticated(): Observable<boolean> {
    if (!this.auth) {
      return of(false);
    }

    // Implementation:
    // return new Observable((subscriber) => {
    //   import { onAuthStateChanged } from 'firebase/auth';
    //   const unsubscribe = onAuthStateChanged(this.auth, (user) => {
    //     subscriber.next(!!user);
    //     subscriber.complete();
    //   });
    //   return () => unsubscribe();
    // });

    return of(false);
  }

  /**
   * Helper method to map Firebase user to app User model
   */
  private mapFirebaseUserToAppUser(firebaseUser: any): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'User',
      photoUrl: firebaseUser.photoURL || undefined,
      roles: ['user'], // Fetch from Firestore custom claims or custom claims
      permissions: [], // Fetch from Firestore
      createdAt: new Date(firebaseUser.metadata?.creationTime || Date.now()),
      lastLogin: new Date(firebaseUser.metadata?.lastSignInTime || Date.now()),
    };
  }
}
