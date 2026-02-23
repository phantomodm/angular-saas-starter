import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileStore } from '../../../core/store/profile.store';
import { CardComponent } from '../../../shared/ui/card.component';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="section-header">Account Settings</h1>
        <p class="section-subheader mt-2">Manage your profile, security, and preferences</p>
      </div>

      <!-- Success message -->
      <div
        *ngIf="profileStore.success()"
        class="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg dark:bg-success-900/20 dark:border-success-800 dark:text-success-200 animate-fade-in"
      >
        {{ profileStore.success() }}
      </div>

      <!-- Error message -->
      <div
        *ngIf="profileStore.error()"
        class="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-200 animate-fade-in"
      >
        {{ profileStore.error() }}
        <button
          (click)="profileStore.clearError()"
          class="ml-2 text-sm font-medium hover:underline"
        >
          Dismiss
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
        <button
          (click)="activeTab.set('profile')"
          [class.border-b-2 border-primary-600]="activeTab() === 'profile'"
          class="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50"
        >
          Profile
        </button>
        <button
          (click)="activeTab.set('security')"
          [class.border-b-2 border-primary-600]="activeTab() === 'security'"
          class="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50"
        >
          Security
        </button>
        <button
          (click)="activeTab.set('preferences')"
          [class.border-b-2 border-primary-600]="activeTab() === 'preferences'"
          class="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50"
        >
          Preferences
        </button>
        <button
          (click)="activeTab.set('danger')"
          [class.border-b-2 border-primary-600]="activeTab() === 'danger'"
          class="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50"
        >
          Danger Zone
        </button>
      </div>

      <!-- Profile Tab -->
      <div *ngIf="activeTab() === 'profile'">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Profile Picture -->
          <app-card>
            <div class="card-body text-center space-y-4">
              <div
                class="w-24 h-24 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center mx-auto overflow-hidden"
              >
                <img
                  *ngIf="profileStore.profile()?.photoUrl"
                  [src]="profileStore.profile()!.photoUrl"
                  alt="Profile"
                  class="w-full h-full object-cover"
                />
                <span
                  *ngIf="!profileStore.profile()?.photoUrl && profileStore.profile()?.displayName"
                  class="text-3xl font-bold text-primary-700 dark:text-primary-200"
                >
                  {{ profileStore.profile()!.displayName.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <p class="font-medium text-neutral-900 dark:text-neutral-50">{{ profileStore.profile()?.displayName }}</p>
                <p class="text-sm text-muted">{{ profileStore.profile()?.email }}</p>
              </div>
              <label class="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  (change)="onProfilePictureChange($event)"
                  hidden
                  [disabled]="profileStore.loading()"
                />
                <span class="btn-secondary inline-block cursor-pointer">
                  Change Picture
                </span>
              </label>
            </div>
          </app-card>

          <!-- Profile Information -->
          <div class="lg:col-span-2">
            <app-card>
              <div class="card-header">
                <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Profile Information</h2>
              </div>
              <form (ngSubmit)="saveProfileChanges()" class="card-body space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="profileFormData.displayName"
                      name="displayName"
                      class="input-field"
                      [disabled]="profileStore.loading()"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Email (cannot change)
                    </label>
                    <input
                      type="email"
                      [value]="profileStore.profile()?.email"
                      class="input-field"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="profileFormData.company"
                    name="company"
                    class="input-field"
                    [disabled]="profileStore.loading()"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="profileFormData.location"
                      name="location"
                      class="input-field"
                      [disabled]="profileStore.loading()"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      [(ngModel)]="profileFormData.phone"
                      name="phone"
                      class="input-field"
                      [disabled]="profileStore.loading()"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    [(ngModel)]="profileFormData.website"
                    name="website"
                    class="input-field"
                    [disabled]="profileStore.loading()"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    [(ngModel)]="profileFormData.bio"
                    name="bio"
                    class="input-field"
                    rows="4"
                    [disabled]="profileStore.loading()"
                  ></textarea>
                </div>

                <div class="flex gap-3 pt-4">
                  <button
                    type="submit"
                    [disabled]="profileStore.loading()"
                    class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ profileStore.loading() ? 'Saving...' : 'Save Changes' }}
                  </button>
                  <button
                    type="button"
                    (click)="resetProfileForm()"
                    [disabled]="profileStore.loading()"
                    class="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </app-card>
          </div>
        </div>
      </div>

      <!-- Security Tab -->
      <div *ngIf="activeTab() === 'security'" class="space-y-6">
        <!-- Change Password -->
        <app-card>
          <div class="card-header">
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Change Password</h2>
          </div>
          <form (ngSubmit)="changePassword()" class="card-body space-y-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                [(ngModel)]="passwordForm.currentPassword"
                name="currentPassword"
                class="input-field"
                [disabled]="profileStore.loading()"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                [(ngModel)]="passwordForm.newPassword"
                name="newPassword"
                class="input-field"
                [disabled]="profileStore.loading()"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                [(ngModel)]="passwordForm.confirmPassword"
                name="confirmPassword"
                class="input-field"
                [disabled]="profileStore.loading()"
              />
            </div>

            <div class="flex gap-3">
              <button
                type="submit"
                [disabled]="profileStore.loading()"
                class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ profileStore.loading() ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </form>
        </app-card>

        <!-- Email Verification -->
        <app-card>
          <div class="card-header">
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Email Verification</h2>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-neutral-900 dark:text-neutral-50">{{ profileStore.profile()?.email }}</p>
                <p
                  class="text-sm mt-1"
                  [class]="profileStore.profile()?.emailVerified ? 'text-success' : 'text-warning'"
                >
                  {{ profileStore.profile()?.emailVerified ? '✓ Verified' : 'Not verified' }}
                </p>
              </div>
              <button *ngIf="!profileStore.profile()?.emailVerified" class="btn-secondary">
                Verify Email
              </button>
            </div>
          </div>
        </app-card>

        <!-- Two-Factor Authentication -->
        <app-card>
          <div class="card-header">
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Two-Factor Authentication</h2>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-neutral-900 dark:text-neutral-50">2FA Status</p>
                <p
                  class="text-sm text-muted mt-1"
                >
                  {{ profileStore.profile()?.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                </p>
              </div>
              <button class="btn-secondary">
                {{ profileStore.profile()?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA' }}
              </button>
            </div>
          </div>
        </app-card>
      </div>

      <!-- Preferences Tab -->
      <div *ngIf="activeTab() === 'preferences'" class="space-y-6">
        <app-card>
          <div class="card-header">
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Preferences</h2>
          </div>
          <form (ngSubmit)="savePreferences()" class="card-body space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Timezone
                </label>
                <select [(ngModel)]="profileFormData.timezone" name="timezone" class="input-field">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Language
                </label>
                <select [(ngModel)]="profileFormData.language" name="language" class="input-field">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </div>

            <div class="flex gap-3">
              <button
                type="submit"
                [disabled]="profileStore.loading()"
                class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </app-card>
      </div>

      <!-- Danger Zone Tab -->
      <div *ngIf="activeTab() === 'danger'">
        <app-card class="border-2 border-danger-200 dark:border-danger-800">
          <div class="card-header bg-danger-50 dark:bg-danger-950">
            <h2 class="font-semibold text-danger-900 dark:text-danger-50">Danger Zone</h2>
          </div>
          <div class="card-body space-y-6">
            <!-- Download Data -->
            <div class="border-b border-neutral-200 dark:border-neutral-700 pb-6">
              <h3 class="font-medium text-neutral-900 dark:text-neutral-50 mb-2">Download Your Data</h3>
              <p class="text-sm text-muted mb-4">Get a copy of your account data in JSON format</p>
              <button class="btn-secondary">Download Data</button>
            </div>

            <!-- Delete Account -->
            <div>
              <h3 class="font-medium text-danger-600 dark:text-danger-400 mb-2">Delete Account</h3>
              <p class="text-sm text-muted mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                (click)="deleteAccount()"
                [disabled]="profileStore.loading()"
                class="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ profileStore.loading() ? 'Deleting...' : 'Delete Account' }}
              </button>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `,
})
export class AccountSettingsComponent {
  profileStore = inject(ProfileStore);

  activeTab = signal<'profile' | 'security' | 'preferences' | 'danger'>('profile');

  profileFormData = {
    displayName: this.profileStore.profile()?.displayName || '',
    company: this.profileStore.profile()?.company || '',
    location: this.profileStore.profile()?.location || '',
    phone: this.profileStore.profile()?.phone || '',
    website: this.profileStore.profile()?.website || '',
    bio: this.profileStore.profile()?.bio || '',
    timezone: this.profileStore.profile()?.timezone || 'UTC',
    language: this.profileStore.profile()?.language || 'en',
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  saveProfileChanges() {
    this.profileStore.updateProfile({
      displayName: this.profileFormData.displayName,
      company: this.profileFormData.company,
      location: this.profileFormData.location,
      phone: this.profileFormData.phone,
      website: this.profileFormData.website,
      bio: this.profileFormData.bio,
    });
  }

  resetProfileForm() {
    const profile = this.profileStore.profile();
    if (profile) {
      this.profileFormData = {
        displayName: profile.displayName,
        company: profile.company || '',
        location: profile.location || '',
        phone: profile.phone || '',
        website: profile.website || '',
        bio: profile.bio || '',
        timezone: profile.timezone || 'UTC',
        language: profile.language || 'en',
      };
    }
  }

  changePassword() {
    this.profileStore.changePassword(
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword,
      this.passwordForm.confirmPassword
    );

    if (!this.profileStore.error()) {
      this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    }
  }

  savePreferences() {
    this.profileStore.updateProfile({
      timezone: this.profileFormData.timezone,
      language: this.profileFormData.language,
    });
  }

  onProfilePictureChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.profileStore.uploadProfilePicture(file);
    }
  }

  deleteAccount() {
    if (confirm('Are you absolutely sure? This will permanently delete your account and all data.')) {
      this.profileStore.deleteProfile();
    }
  }
}
