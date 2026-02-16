import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, delay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserProfile, CreateProfileRequest, UpdateProfileRequest, ChangePasswordRequest } from '../models/profile.model';

/**
 * Profile Service handles all CRUD operations for user profiles
 * Includes both mock API for testing and real HTTP methods
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = '/api/profiles';
  private mockProfiles: Map<string, UserProfile> = new Map();

  constructor(private http: HttpClient) {
    this.initializeMockData();
  }

  /**
   * Initialize mock profile data for testing
   */
  private initializeMockData() {
    const adminProfile: UserProfile = {
      id: '1',
      email: 'admin@example.com',
      displayName: 'Admin User',
      photoUrl: undefined,
      bio: 'Administrator of Fusion SaaS platform',
      company: 'Your Company',
      location: 'San Francisco, CA',
      phone: '+1 (555) 123-4567',
      timezone: 'America/Los_Angeles',
      language: 'en',
      website: 'https://example.com',
      roles: ['admin', 'user'],
      permissions: ['user.manage', 'role.assign', 'analytics.view', 'api-key.create'],
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-06-01'),
      lastLogin: new Date(),
    };

    const userProfile: UserProfile = {
      id: '2',
      email: 'user@example.com',
      displayName: 'Regular User',
      photoUrl: undefined,
      bio: 'Regular user of the platform',
      company: 'Tech Startup',
      location: 'New York, NY',
      phone: '+1 (555) 987-6543',
      timezone: 'America/New_York',
      language: 'en',
      website: 'https://user-site.com',
      roles: ['user'],
      permissions: ['analytics.view', 'api-key.create', 'billing.view'],
      status: 'active',
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-05-20'),
      lastLogin: new Date(),
    };

    const devProfile: UserProfile = {
      id: '3',
      email: 'developer@example.com',
      displayName: 'Developer User',
      photoUrl: undefined,
      bio: 'Developer exploring API capabilities',
      company: 'Dev Studio',
      location: 'Austin, TX',
      phone: '+1 (555) 456-7890',
      timezone: 'America/Chicago',
      language: 'en',
      website: 'https://dev-portfolio.com',
      roles: ['developer', 'user'],
      permissions: ['developer.manage', 'api-key.create', 'analytics.view'],
      status: 'active',
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: true,
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-06-10'),
      lastLogin: new Date(),
    };

    this.mockProfiles.set(adminProfile.id, adminProfile);
    this.mockProfiles.set(userProfile.id, userProfile);
    this.mockProfiles.set(devProfile.id, devProfile);
  }

  /**
   * Get profile by ID (Mock implementation for development)
   */
  getProfile(userId: string): Observable<UserProfile> {
    const profile = this.mockProfiles.get(userId);
    if (!profile) {
      return throwError(() => new Error('Profile not found'));
    }
    return of(profile).pipe(delay(300));

    // Production implementation:
    // return this.http.get<UserProfile>(`${this.apiUrl}/${userId}`).pipe(
    //   catchError(error => throwError(() => new Error(error.message)))
    // );
  }

  /**
   * Get all profiles (Admin only)
   */
  getAllProfiles(): Observable<UserProfile[]> {
    return of(Array.from(this.mockProfiles.values())).pipe(delay(500));

    // Production implementation:
    // return this.http.get<UserProfile[]>(this.apiUrl).pipe(
    //   catchError(error => throwError(() => new Error(error.message)))
    // );
  }

  /**
   * Create new profile
   */
  createProfile(data: CreateProfileRequest): Observable<UserProfile> {
    const newProfile: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      displayName: data.displayName,
      photoUrl: data.photoUrl,
      bio: '',
      company: '',
      location: '',
      phone: '',
      timezone: 'UTC',
      language: 'en',
      website: '',
      roles: ['user'],
      permissions: ['analytics.view', 'api-key.create', 'billing.view'],
      status: 'onboarding',
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockProfiles.set(newProfile.id, newProfile);
    return of(newProfile).pipe(delay(400));

    // Production implementation:
    // return this.http.post<UserProfile>(this.apiUrl, data).pipe(
    //   catchError(error => throwError(() => new Error(error.message)))
    // );
  }

  /**
   * Update profile
   */
  updateProfile(userId: string, data: UpdateProfileRequest): Observable<UserProfile> {
    const profile = this.mockProfiles.get(userId);
    if (!profile) {
      return throwError(() => new Error('Profile not found'));
    }

    const updatedProfile: UserProfile = {
      ...profile,
      ...data,
      updatedAt: new Date(),
    };

    this.mockProfiles.set(userId, updatedProfile);
    return of(updatedProfile).pipe(delay(400));

    // Production implementation:
    // return this.http.patch<UserProfile>(`${this.apiUrl}/${userId}`, data).pipe(
    //   catchError(error => throwError(() => new Error(error.message)))
    // );
  }

  /**
   * Complete onboarding
   */
  completeOnboarding(userId: string, data: Partial<UserProfile>): Observable<UserProfile> {
    const profile = this.mockProfiles.get(userId);
    if (!profile) {
      return throwError(() => new Error('Profile not found'));
    }

    const updatedProfile: UserProfile = {
      ...profile,
      ...data,
      status: 'active',
      updatedAt: new Date(),
    };

    this.mockProfiles.set(userId, updatedProfile);
    return of(updatedProfile).pipe(delay(500));
  }

  /**
   * Change password
   */
  changePassword(userId: string, data: ChangePasswordRequest): Observable<{ message: string }> {
    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      return throwError(() => new Error('Passwords do not match'));
    }

    if (data.newPassword.length < 8) {
      return throwError(() => new Error('Password must be at least 8 characters'));
    }

    const profile = this.mockProfiles.get(userId);
    if (!profile) {
      return throwError(() => new Error('Profile not found'));
    }

    // Update lastPasswordChange
    profile.lastPasswordChange = new Date();
    profile.updatedAt = new Date();

    return of({ message: 'Password changed successfully' }).pipe(delay(400));

    // Production implementation:
    // return this.http.post(`${this.apiUrl}/${userId}/change-password`, data).pipe(
    //   map(() => ({ message: 'Password changed successfully' })),
    //   catchError(error => throwError(() => new Error(error.message)))
    // );
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(userId: string, file: File): Observable<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    // For mock, generate a data URL
    return new Observable<{ photoUrl: string }>((observer) => {
      const reader = new FileReader();
      reader.onload = () => {
        const profile = this.mockProfiles.get(userId);
        if (profile) {
          profile.photoUrl = reader.result as string;
          profile.updatedAt = new Date();
        }
        observer.next({ photoUrl: reader.result as string });
        observer.complete();
      };
      reader.readAsDataURL(file);
    }).pipe(delay(600));

    // Production implementation:
    // return this.http.post<{ photoUrl: string }>(`${this.apiUrl}/${userId}/upload-picture`, formData).pipe(
    //   catchError(error => throwError(() => new Error(error.message)))
    // );
  }

  /**
   * Delete profile (Admin only or self-delete)
   */
  deleteProfile(userId: string): Observable<{ message: string }> {
    if (!this.mockProfiles.has(userId)) {
      return throwError(() => new Error('Profile not found'));
    }

    this.mockProfiles.delete(userId);
    return of({ message: 'Profile deleted successfully' }).pipe(delay(500));

    // Production implementation:
    // return this.http.delete(`${this.apiUrl}/${userId}`).pipe(
    //   map(() => ({ message: 'Profile deleted successfully' })),
    //   catchError(error => throwError(() => new Error(error.message)))
    // );
  }

  /**
   * Search profiles (Admin only)
   */
  searchProfiles(query: string): Observable<UserProfile[]> {
    const results = Array.from(this.mockProfiles.values()).filter(
      (profile) =>
        profile.displayName.toLowerCase().includes(query.toLowerCase()) ||
        profile.email.toLowerCase().includes(query.toLowerCase()) ||
        (profile.company && profile.company.toLowerCase().includes(query.toLowerCase()))
    );

    return of(results).pipe(delay(300));
  }

  /**
   * Update user roles (Admin only)
   */
  updateUserRoles(userId: string, roles: string[]): Observable<UserProfile> {
    const profile = this.mockProfiles.get(userId);
    if (!profile) {
      return throwError(() => new Error('Profile not found'));
    }

    profile.roles = roles;
    profile.updatedAt = new Date();

    return of(profile).pipe(delay(400));
  }

  /**
   * Verify email
   */
  verifyEmail(userId: string, token: string): Observable<UserProfile> {
    const profile = this.mockProfiles.get(userId);
    if (!profile) {
      return throwError(() => new Error('Profile not found'));
    }

    profile.emailVerified = true;
    profile.updatedAt = new Date();

    return of(profile).pipe(delay(300));
  }

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor(userId: string): Observable<{ secret: string; qrCode: string }> {
    // In real implementation, generate TOTP secret and QR code
    return of({
      secret: 'JBSWY3DPEBLW64TMMQ======',
      qrCode: 'data:image/svg+xml;...',
    }).pipe(delay(400));
  }
}
