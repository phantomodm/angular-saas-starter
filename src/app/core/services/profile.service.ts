import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  UserProfile,
  CreateProfileRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../models/profile.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly userApi = '/api/user';
  private readonly adminApi = '/api/admin';

  constructor(private http: HttpClient) {}

  getProfile(userId: string): Observable<UserProfile> {
    return this.http.get<ApiResponse<any>>(`${this.userApi}/profile`).pipe(
      map((response) => this.mapApiUserToProfile(response.data, userId)),
      catchError((error) =>
        throwError(
          () => new Error(error?.error?.detail || 'Failed to fetch profile'),
        ),
      ),
    );
  }

  getAllProfiles(): Observable<UserProfile[]> {
    return this.http
      .get<ApiResponse<{ users?: any[] }>>(`${this.adminApi}/users`)
      .pipe(
        map((response) =>
          (response.data?.users || []).map((user) =>
            this.mapApiUserToProfile(user),
          ),
        ),
        catchError(() => of([])),
      );
  }

  createProfile(data: CreateProfileRequest): Observable<UserProfile> {
    return this.http
      .put<ApiResponse<any>>(`${this.userApi}/profile`, data)
      .pipe(
        map((response) => this.mapApiUserToProfile(response.data)),
        catchError((error) =>
          throwError(
            () => new Error(error?.error?.detail || 'Failed to create profile'),
          ),
        ),
      );
  }

  updateProfile(
    userId: string,
    data: UpdateProfileRequest,
  ): Observable<UserProfile> {
    return this.http
      .put<ApiResponse<any>>(`${this.userApi}/profile`, data)
      .pipe(
        map((response) =>
          this.mapApiUserToProfile(response.data, userId, data),
        ),
        catchError((error) =>
          throwError(
            () => new Error(error?.error?.detail || 'Failed to update profile'),
          ),
        ),
      );
  }

  completeOnboarding(
    userId: string,
    data: Partial<UserProfile>,
  ): Observable<UserProfile> {
    return this.updateProfile(userId, {
      displayName: data.displayName,
      bio: data.bio,
      company: data.company,
      location: data.location,
      phone: data.phone,
      timezone: data.timezone,
      language: data.language,
      website: data.website,
      photoUrl: data.photoUrl,
    });
  }

  changePassword(
    userId: string,
    data: ChangePasswordRequest,
  ): Observable<{ message: string }> {
    if (data.newPassword !== data.confirmPassword) {
      return throwError(() => new Error('Passwords do not match'));
    }

    if (data.newPassword.length < 8) {
      return throwError(
        () => new Error('Password must be at least 8 characters'),
      );
    }

    return this.http
      .post<ApiResponse<any>>(`${this.userApi}/change-password`, {
        userId,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      .pipe(
        map(() => ({ message: 'Password changed successfully' })),
        catchError((error) =>
          throwError(
            () =>
              new Error(error?.error?.detail || 'Failed to change password'),
          ),
        ),
      );
  }

  uploadProfilePicture(
    userId: string,
    file: File,
  ): Observable<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    return this.http
      .post<
        ApiResponse<{ photoUrl?: string }>
      >(`${this.userApi}/upload-picture`, formData)
      .pipe(
        map((response) => ({ photoUrl: response.data?.photoUrl || '' })),
        catchError((error) =>
          throwError(
            () => new Error(error?.error?.detail || 'Failed to upload picture'),
          ),
        ),
      );
  }

  deleteProfile(userId: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<any>>(`${this.adminApi}/users/${userId}`)
      .pipe(
        map(() => ({ message: 'Profile deleted successfully' })),
        catchError((error) =>
          throwError(
            () => new Error(error?.error?.detail || 'Failed to delete profile'),
          ),
        ),
      );
  }

  searchProfiles(query: string): Observable<UserProfile[]> {
    return this.getAllProfiles().pipe(
      map((profiles) => {
        const search = query.toLowerCase();
        return profiles.filter(
          (profile) =>
            profile.displayName.toLowerCase().includes(search) ||
            profile.email.toLowerCase().includes(search) ||
            !!profile.company?.toLowerCase().includes(search),
        );
      }),
    );
  }

  updateUserRoles(userId: string, roles: string[]): Observable<UserProfile> {
    return this.http
      .post<
        ApiResponse<any>
      >(`${this.adminApi}/users/${userId}/roles`, { roles })
      .pipe(
        map((response) =>
          this.mapApiUserToProfile(response.data, userId, { roles } as any),
        ),
        catchError((error) =>
          throwError(
            () =>
              new Error(error?.error?.detail || 'Failed to update user roles'),
          ),
        ),
      );
  }

  verifyEmail(userId: string, token: string): Observable<UserProfile> {
    return this.http
      .post<ApiResponse<any>>('/api/auth/verify-email', { userId, token })
      .pipe(
        map((response) =>
          this.mapApiUserToProfile(response.data, userId, {
            emailVerified: true,
          } as any),
        ),
        catchError((error) =>
          throwError(
            () => new Error(error?.error?.detail || 'Failed to verify email'),
          ),
        ),
      );
  }

  enableTwoFactor(
    userId: string,
  ): Observable<{ secret: string; qrCode: string }> {
    return this.http
      .post<
        ApiResponse<{ secret?: string; qrCode?: string }>
      >(`${this.userApi}/two-factor/enable`, { userId })
      .pipe(
        map((response) => ({
          secret: response.data?.secret || '',
          qrCode: response.data?.qrCode || '',
        })),
        catchError((error) =>
          throwError(
            () => new Error(error?.error?.detail || 'Failed to enable 2FA'),
          ),
        ),
      );
  }

  private mapApiUserToProfile(
    apiUser: any,
    fallbackId?: string,
    patch?: Partial<UserProfile>,
  ): UserProfile {
    const claims = apiUser?.custom_claims || apiUser?.customClaims || {};
    const role = claims.role;
    const roles = Array.isArray(claims.roles)
      ? claims.roles
      : role
        ? [role]
        : ['user'];
    const permissions = Array.isArray(claims.permissions)
      ? claims.permissions
      : [];

    return {
      id: apiUser?.uid || apiUser?.id || fallbackId || 'unknown',
      email: apiUser?.email || '',
      displayName: apiUser?.display_name || apiUser?.displayName || 'User',
      photoUrl: apiUser?.photo_url || apiUser?.photoUrl,
      bio: patch?.bio || '',
      company: patch?.company || '',
      location: patch?.location || '',
      phone: patch?.phone || '',
      timezone: patch?.timezone || 'UTC',
      language: patch?.language || 'en',
      website: patch?.website || '',
      roles,
      permissions,
      status: (patch?.status as UserProfile['status']) || 'active',
      emailVerified: !!apiUser?.email_verified,
      phoneVerified: patch?.phoneVerified || false,
      twoFactorEnabled: patch?.twoFactorEnabled || false,
      createdAt: apiUser?.created_at
        ? new Date(apiUser.created_at)
        : new Date(),
      updatedAt: new Date(),
      lastLogin: apiUser?.last_login ? new Date(apiUser.last_login) : undefined,
      lastPasswordChange: patch?.lastPasswordChange,
      ...patch,
    };
  }
}
