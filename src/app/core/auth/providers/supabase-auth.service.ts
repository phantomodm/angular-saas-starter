import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthAdapter } from '../auth.adapter';
import { User, AuthCredentials, SignUpData, PasswordResetRequest, PasswordReset } from '../../models/user.model';

/**
 * Supabase Authentication Service
 *
 * Implements the AuthAdapter interface using Supabase (Firebase alternative).
 * Supabase provides PostgreSQL database with authentication built-in.
 *
 * Installation:
 * npm install @supabase/supabase-js
 *
 * Setup in environment or main.ts:
 * import { createClient } from '@supabase/supabase-js';
 * export const supabase = createClient(
 *   'YOUR_SUPABASE_URL',
 *   'YOUR_SUPABASE_ANON_KEY'
 * );
 *
 * Usage in app.config.ts:
 * {
 *   provide: AuthAdapter,
 *   useClass: SupabaseAuthService,
 * }
 */
@Injectable()
export class SupabaseAuthService extends AuthAdapter {
  private supabase: any; // Supabase client instance
  private currentUser: User | null = null;

  constructor() {
    super();
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client
   * The supabase client should be created and injected or created here
   */
  private initializeSupabase() {
    try {
      // import { createClient } from '@supabase/supabase-js';
      // import { environment } from './environments/environment';
      // this.supabase = createClient(
      //   environment.supabaseUrl,
      //   environment.supabaseAnonKey
      // );

      console.warn('Supabase not initialized. Please set up Supabase client in your environment.');
    } catch (error) {
      console.error('Failed to initialize Supabase', error);
    }
  }

  login(credentials: AuthCredentials): Observable<{ user: User; token: string }> {
    if (!this.supabase) {
      return throwError(() => new Error('Supabase not initialized'));
    }

    // Implementation:
    // return from(this.supabase.auth.signInWithPassword({
    //   email: credentials.email,
    //   password: credentials.password,
    // })).pipe(
    //   switchMap((response: any) => {
    //     if (response.error) {
    //       return throwError(() => new Error(response.error.message));
    //     }
    //     return from(this.fetchUserProfile(response.data.user.id)).pipe(
    //       map((userProfile) => ({
    //         user: this.mapSupabaseUserToAppUser(response.data.user, userProfile),
    //         token: response.data.session?.access_token || '',
    //       }))
    //     );
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Supabase not initialized'));
  }

  signup(data: SignUpData): Observable<{ user: User; token: string }> {
    if (!this.supabase) {
      return throwError(() => new Error('Supabase not initialized'));
    }

    // Implementation:
    // return from(this.supabase.auth.signUp({
    //   email: data.email,
    //   password: data.password,
    //   options: {
    //     data: {
    //       display_name: data.displayName,
    //     },
    //   },
    // })).pipe(
    //   switchMap((response: any) => {
    //     if (response.error) {
    //       return throwError(() => new Error(response.error.message));
    //     }
    //     // Create user profile in public.users table
    //     return from(this.supabase.from('users').insert({
    //       id: response.data.user?.id,
    //       email: data.email,
    //       display_name: data.displayName,
    //       roles: ['user'],
    //       permissions: [],
    //     })).pipe(
    //       map(() => ({
    //         user: this.mapSupabaseUserToAppUser(response.data.user, {
    //           id: response.data.user?.id,
    //           email: data.email,
    //           display_name: data.displayName,
    //           roles: ['user'],
    //           permissions: [],
    //         }),
    //         token: response.data.session?.access_token || '',
    //       }))
    //     );
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Supabase not initialized'));
  }

  logout(): Observable<void> {
    if (!this.supabase) {
      return throwError(() => new Error('Supabase not initialized'));
    }

    // Implementation:
    // return from(this.supabase.auth.signOut()).pipe(
    //   tap(() => {
    //     this.currentUser = null;
    //   }),
    //   map(() => undefined),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Supabase not initialized'));
  }

  getCurrentUser(): Observable<User | null> {
    if (!this.supabase) {
      return of(null);
    }

    // Implementation:
    // return from(this.supabase.auth.getSession()).pipe(
    //   switchMap((response: any) => {
    //     if (!response.data?.session?.user) {
    //       return of(null);
    //     }
    //     return from(this.fetchUserProfile(response.data.session.user.id)).pipe(
    //       map((userProfile) => {
    //         this.currentUser = this.mapSupabaseUserToAppUser(response.data.session.user, userProfile);
    //         return this.currentUser;
    //       })
    //     );
    //   }),
    //   catchError(() => of(null))
    // );

    return of(null);
  }

  refreshToken(): Observable<string> {
    if (!this.supabase) {
      return throwError(() => new Error('Not authenticated'));
    }

    // Implementation:
    // return from(this.supabase.auth.refreshSession()).pipe(
    //   map((response: any) => {
    //     if (response.error) {
    //       throw new Error(response.error.message);
    //     }
    //     return response.data.session?.access_token || '';
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Supabase not initialized'));
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<void> {
    if (!this.supabase) {
      return throwError(() => new Error('Supabase not initialized'));
    }

    // Implementation:
    // return from(this.supabase.auth.resetPasswordForEmail(request.email, {
    //   redirectTo: `${window.location.origin}/reset-password`,
    // })).pipe(
    //   switchMap((response: any) => {
    //     if (response.error) {
    //       return throwError(() => new Error(response.error.message));
    //     }
    //     return of(undefined);
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Supabase not initialized'));
  }

  resetPassword(data: PasswordReset): Observable<void> {
    if (!this.supabase) {
      return throwError(() => new Error('Supabase not initialized'));
    }

    // Implementation:
    // return from(this.supabase.auth.updateUser({
    //   password: data.newPassword,
    // })).pipe(
    //   switchMap((response: any) => {
    //     if (response.error) {
    //       return throwError(() => new Error(response.error.message));
    //     }
    //     return of(undefined);
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Supabase not initialized'));
  }

  verifyEmail(token: string): Observable<void> {
    if (!this.supabase) {
      return throwError(() => new Error('Supabase not initialized'));
    }

    // Implementation:
    // return from(this.supabase.auth.verifyOtp({
    //   token_hash: token,
    //   type: 'email',
    // })).pipe(
    //   switchMap((response: any) => {
    //     if (response.error) {
    //       return throwError(() => new Error(response.error.message));
    //     }
    //     return of(undefined);
    //   }),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Supabase not initialized'));
  }

  isAuthenticated(): Observable<boolean> {
    if (!this.supabase) {
      return of(false);
    }

    // Implementation:
    // return from(this.supabase.auth.getSession()).pipe(
    //   map((response: any) => !!response.data?.session),
    //   catchError(() => of(false))
    // );

    return of(false);
  }

  /**
   * Fetch user profile from Supabase users table
   */
  private fetchUserProfile(userId: string): Observable<any> {
    if (!this.supabase) {
      return throwError(() => new Error('Supabase not initialized'));
    }

    // Implementation:
    // return from(this.supabase
    //   .from('users')
    //   .select('*')
    //   .eq('id', userId)
    //   .single()).pipe(
    //   map((response: any) => response.data),
    //   catchError((error) => throwError(() => new Error(error.message)))
    // );

    return throwError(() => new Error('Supabase not initialized'));
  }

  /**
   * Helper method to map Supabase user to app User model
   */
  private mapSupabaseUserToAppUser(supabaseUser: any, userProfile: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      displayName: userProfile?.display_name || supabaseUser.user_metadata?.display_name || 'User',
      photoUrl: userProfile?.avatar_url || supabaseUser.user_metadata?.avatar_url || undefined,
      roles: userProfile?.roles || ['user'],
      permissions: userProfile?.permissions || [],
      createdAt: new Date(supabaseUser.created_at),
      lastLogin: new Date(supabaseUser.last_sign_in_at || Date.now()),
    };
  }
}
