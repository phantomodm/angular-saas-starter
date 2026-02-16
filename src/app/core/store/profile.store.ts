import { Injectable, computed, inject, signal } from '@angular/core';
import { UserProfile, UpdateProfileRequest, OnboardingData } from '../models/profile.model';
import { ProfileService } from '../services/profile.service';
import { AuthStore } from './auth.store';

/**
 * ProfileStore manages user profile state using Angular signals
 * Provides CRUD operations for user profiles
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private profileService = inject(ProfileService);
  private authStore = inject(AuthStore);

  // State signals
  profile = signal<UserProfile | null>(null);
  profiles = signal<UserProfile[]>([]); // For admin user management
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  saveSuccess = signal(false);

  // Computed signals
  isProfileComplete = computed(() => {
    const p = this.profile();
    return p && p.displayName && p.email && p.status !== 'onboarding';
  });

  isAdmin = computed(() => this.authStore.isAdmin());

  constructor() {
    // Load user profile on init
    this.loadProfile();
  }

  /**
   * Load current user's profile
   */
  loadProfile() {
    const userId = this.authStore.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    this.error.set(null);

    this.profileService.getProfile(userId).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load profile');
        this.loading.set(false);
      },
    });
  }

  /**
   * Load all profiles (Admin only)
   */
  loadProfiles() {
    if (!this.isAdmin()) {
      this.error.set('Insufficient permissions');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.profileService.getAllProfiles().subscribe({
      next: (profiles) => {
        this.profiles.set(profiles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load profiles');
        this.loading.set(false);
      },
    });
  }

  /**
   * Update user's profile
   */
  updateProfile(data: UpdateProfileRequest) {
    const userId = this.profile()?.id;
    if (!userId) {
      this.error.set('No profile loaded');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.saveSuccess.set(false);

    this.profileService.updateProfile(userId, data).subscribe({
      next: (updatedProfile) => {
        this.profile.set(updatedProfile);
        this.success.set('Profile updated successfully');
        this.saveSuccess.set(true);
        this.loading.set(false);

        // Clear success message after 3 seconds
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to update profile');
        this.loading.set(false);
      },
    });
  }

  /**
   * Complete onboarding
   */
  completeOnboarding(data: OnboardingData) {
    const userId = this.profile()?.id;
    if (!userId) {
      this.error.set('No profile loaded');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.profileService.completeOnboarding(userId, data).subscribe({
      next: (updatedProfile) => {
        this.profile.set(updatedProfile);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to complete onboarding');
        this.loading.set(false);
      },
    });
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    const userId = this.profile()?.id;
    if (!userId) {
      this.error.set('No profile loaded');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.profileService.changePassword(userId, { currentPassword, newPassword, confirmPassword }).subscribe({
      next: () => {
        this.success.set('Password changed successfully');
        this.loading.set(false);
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to change password');
        this.loading.set(false);
      },
    });
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(file: File) {
    const userId = this.profile()?.id;
    if (!userId) {
      this.error.set('No profile loaded');
      return;
    }

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.error.set('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.error.set('File size must be less than 5MB');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.profileService.uploadProfilePicture(userId, file).subscribe({
      next: (response) => {
        const profile = this.profile();
        if (profile) {
          profile.photoUrl = response.photoUrl;
          profile.updatedAt = new Date();
          this.profile.set({ ...profile });
        }
        this.success.set('Profile picture updated successfully');
        this.loading.set(false);
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to upload picture');
        this.loading.set(false);
      },
    });
  }

  /**
   * Delete profile
   */
  deleteProfile() {
    const userId = this.profile()?.id;
    if (!userId) {
      this.error.set('No profile loaded');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.profileService.deleteProfile(userId).subscribe({
      next: () => {
        this.profile.set(null);
        this.success.set('Profile deleted successfully. Redirecting to login...');
        this.loading.set(false);

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.authStore.logout();
        }, 2000);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to delete profile');
        this.loading.set(false);
      },
    });
  }

  /**
   * Search profiles (Admin)
   */
  searchProfiles(query: string) {
    if (!this.isAdmin()) {
      this.error.set('Insufficient permissions');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.profileService.searchProfiles(query).subscribe({
      next: (results) => {
        this.profiles.set(results);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Search failed');
        this.loading.set(false);
      },
    });
  }

  /**
   * Update user roles (Admin)
   */
  updateUserRoles(userId: string, roles: string[]) {
    if (!this.isAdmin()) {
      this.error.set('Insufficient permissions');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.profileService.updateUserRoles(userId, roles).subscribe({
      next: (updatedProfile) => {
        // Update in profiles list
        const profiles = this.profiles();
        const index = profiles.findIndex((p) => p.id === userId);
        if (index !== -1) {
          profiles[index] = updatedProfile;
          this.profiles.set([...profiles]);
        }
        this.success.set('User roles updated successfully');
        this.loading.set(false);
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to update roles');
        this.loading.set(false);
      },
    });
  }

  /**
   * Clear error message
   */
  clearError() {
    this.error.set(null);
  }

  /**
   * Clear success message
   */
  clearSuccess() {
    this.success.set(null);
  }
}
