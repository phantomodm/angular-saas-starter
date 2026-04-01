import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileStore } from '../../../core/store/profile.store';
import { OnboardingData } from '../../../core/models/profile.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center px-4">
      <div class="w-full max-w-2xl">
        <!-- Progress indicator -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Complete Your Profile</h1>
            <span class="text-sm text-muted">Step {{ currentStep() }} of {{ totalSteps }}</span>
          </div>
          <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              class="bg-primary-600 h-2 rounded-full transition-all duration-300"
              [style.width.%]="(currentStep() / totalSteps) * 100"
            ></div>
          </div>
        </div>
    
        <!-- Form card -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8">
          <form (ngSubmit)="submitOnboarding()">
            <!-- Step 1: Basic Info -->
            @if (currentStep() === 1) {
              <div class="space-y-6 animate-fade-in">
                <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Let's get started!</h2>
                <p class="text-neutral-600 dark:text-neutral-400">Tell us a bit about yourself</p>
                <div>
                  <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="formData.displayName"
                    name="displayName"
                    class="input-field"
                    placeholder="John Doe"
                    required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.company"
                      name="company"
                      class="input-field"
                      placeholder="Your Company"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="formData.location"
                        name="location"
                        class="input-field"
                        placeholder="City, Country"
                        />
                      </div>
                    </div>
                  }
    
                  <!-- Step 2: Contact Info -->
                  @if (currentStep() === 2) {
                    <div class="space-y-6 animate-fade-in">
                      <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Contact Information</h2>
                      <p class="text-neutral-600 dark:text-neutral-400">How can we reach you?</p>
                      <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          [(ngModel)]="formData.phone"
                          name="phone"
                          class="input-field"
                          placeholder="+1 (555) 000-0000"
                          />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            [(ngModel)]="formData.website"
                            name="website"
                            class="input-field"
                            placeholder="https://yourwebsite.com"
                            />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Bio
                            </label>
                            <textarea
                              [(ngModel)]="formData.bio"
                              name="bio"
                              class="input-field"
                              placeholder="Tell us about yourself..."
                              rows="4"
                            ></textarea>
                          </div>
                        </div>
                      }
    
                      <!-- Step 3: Preferences -->
                      @if (currentStep() === 3) {
                        <div class="space-y-6 animate-fade-in">
                          <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Your Preferences</h2>
                          <p class="text-neutral-600 dark:text-neutral-400">Customize your experience</p>
                          <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Timezone
                            </label>
                            <select [(ngModel)]="formData.timezone" name="timezone" class="input-field">
                              <option value="UTC">UTC</option>
                              <option value="America/New_York">Eastern Time</option>
                              <option value="America/Chicago">Central Time</option>
                              <option value="America/Denver">Mountain Time</option>
                              <option value="America/Los_Angeles">Pacific Time</option>
                              <option value="Europe/London">London</option>
                              <option value="Europe/Paris">Paris</option>
                              <option value="Asia/Tokyo">Tokyo</option>
                              <option value="Asia/Shanghai">Shanghai</option>
                              <option value="Australia/Sydney">Sydney</option>
                            </select>
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Language
                            </label>
                            <select [(ngModel)]="formData.language" name="language" class="input-field">
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                              <option value="de">German</option>
                              <option value="it">Italian</option>
                              <option value="pt">Portuguese</option>
                              <option value="ja">Japanese</option>
                              <option value="zh">Chinese</option>
                            </select>
                          </div>
                          <label class="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" [(ngModel)]="agreeToTerms" name="agreeToTerms" class="w-4 h-4" />
                            <span class="text-sm text-neutral-700 dark:text-neutral-300">
                              I agree to the Terms of Service and Privacy Policy
                            </span>
                          </label>
                        </div>
                      }
    
                      <!-- Error message -->
                      @if (profileStore.error()) {
                        <div
                          class="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-200 mb-6"
                          >
                          {{ profileStore.error() }}
                        </div>
                      }
    
                      <!-- Action buttons -->
                      <div class="flex gap-4 pt-8">
                        @if (currentStep() > 1) {
                          <button
                            type="button"
                            (click)="previousStep()"
                            class="btn-secondary flex-1"
                            [disabled]="profileStore.loading()"
                            >
                            Previous
                          </button>
                        }
    
                        @if (currentStep() < totalSteps) {
                          <button
                            type="button"
                            (click)="nextStep()"
                            class="btn-primary flex-1"
                            >
                            Next
                          </button>
                        }
    
                        @if (currentStep() === totalSteps) {
                          <button
                            type="submit"
                            [disabled]="!agreeToTerms || profileStore.loading()"
                            class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                            @if (!profileStore.loading()) {
                              <span>Complete Setup</span>
                            }
                            @if (profileStore.loading()) {
                              <span class="flex items-center justify-center gap-2">
                                <svg class="animate-spin h-4 w-4" viewBox="0 0 50 50">
                                  <circle class="opacity-30" cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" fill="none" />
                                  <circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" fill="none" stroke-dasharray="100" stroke-dashoffset="75" />
                                </svg>
                                Completing...
                              </span>
                            }
                          </button>
                        }
                      </div>
                    </form>
    
                    <!-- Skip option -->
                    <div class="text-center mt-6">
                      <button
                        type="button"
                        (click)="skipOnboarding()"
                        class="text-neutral-600 hover:text-neutral-900 text-sm dark:text-neutral-400 dark:hover:text-neutral-50"
                        [disabled]="profileStore.loading()"
                        >
                        Skip for now →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
    `,
})
export class OnboardingComponent {
  profileStore = inject(ProfileStore);
  router = inject(Router);

  currentStep = signal(1);
  totalSteps = 3;
  agreeToTerms = signal(false);

  formData: OnboardingData = {
    displayName: '',
    company: '',
    location: '',
    phone: '',
    timezone: 'UTC',
    language: 'en',
    bio: '',
    website: '',
  };

  nextStep() {
    // Validate current step
    if (this.currentStep() === 1) {
      if (!this.formData.displayName) {
        this.profileStore.error.set('Please enter your full name');
        return;
      }
    }

    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((step) => step + 1);
      this.profileStore.clearError();
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
      this.profileStore.clearError();
    }
  }

  submitOnboarding() {
    if (!this.agreeToTerms()) {
      this.profileStore.error.set('Please agree to the Terms of Service');
      return;
    }

    this.profileStore.completeOnboarding(this.formData);

    // Redirect after successful completion
    setTimeout(() => {
      if (this.profileStore.profile()?.status === 'active') {
        this.router.navigate(['/dashboard']);
      }
    }, 1000);
  }

  skipOnboarding() {
    this.router.navigate(['/dashboard']);
  }
}
