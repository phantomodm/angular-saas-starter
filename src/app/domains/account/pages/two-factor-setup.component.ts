import { Component, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TwoFactorAuthService } from '../../../core/services/two-factor-auth';
import { signal } from '@angular/core';
import { CardComponent, CardBodyComponent, CardHeaderComponent } from '../../../shared/ui/card.component';

@Component({
  selector: 'app-two-factor-setup',
  standalone: true,
  imports: [FormsModule, CardComponent, CardBodyComponent, CardHeaderComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">Two-Factor Authentication</h1>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          Secure your account with 2FA
        </p>
      </div>

      <!-- Status -->
      <app-card>
        <app-card-header>
          <h2 class="font-semibold text-neutral-900 dark:text-white">Security Status</h2>
        </app-card-header>
        <app-card-body>
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-neutral-900 dark:text-white">Two-Factor Authentication</p>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
            <div>
              @if (twoFAStatus().enabled) {
                <span class="px-3 py-1 bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded-full text-sm font-medium">
                  Enabled
                </span>
              } @else {
                <span class="px-3 py-1 bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300 rounded-full text-sm font-medium">
                  Disabled
                </span>
              }
            </div>
          </div>
        </app-card-body>
      </app-card>

      <!-- Setup Flow -->
      @if (!twoFAStatus().enabled) {
        <app-card>
          <app-card-header>
            <h2 class="font-semibold text-neutral-900 dark:text-white">Set Up 2FA</h2>
          </app-card-header>
          <app-card-body class="space-y-6">
            <!-- Step 1 -->
            @if (currentStep() === 1) {
              <div class="space-y-4">
                <div class="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                  <div class="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h3 class="font-semibold text-neutral-900 dark:text-white">Choose Authentication Method</h3>
                  </div>
                </div>

                <div class="space-y-3">
                  <label class="flex items-center p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                    <input
                      type="radio"
                      [checked]="selectedMethod() === 'totp'"
                      (change)="selectedMethod.set('totp')"
                      class="w-4 h-4"
                    />
                    <div class="ml-3">
                      <p class="font-medium text-neutral-900 dark:text-white">Authenticator App</p>
                      <p class="text-xs text-neutral-600 dark:text-neutral-400">Google Authenticator, Authy, Microsoft Authenticator</p>
                    </div>
                  </label>

                  <label class="flex items-center p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                    <input
                      type="radio"
                      [checked]="selectedMethod() === 'sms'"
                      (change)="selectedMethod.set('sms')"
                      disabled
                      class="w-4 h-4"
                    />
                    <div class="ml-3 opacity-50">
                      <p class="font-medium text-neutral-900 dark:text-white">SMS</p>
                      <p class="text-xs text-neutral-600 dark:text-neutral-400">Receive codes via text message (coming soon)</p>
                    </div>
                  </label>
                </div>

                <button
                  (click)="setupStep2()"
                  class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  Continue
                </button>
              </div>
            }

            <!-- Step 2 -->
            @if (currentStep() === 2) {
              <div class="space-y-4">
                <div class="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                  <div class="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h3 class="font-semibold text-neutral-900 dark:text-white">Scan QR Code</h3>
                  </div>
                </div>

                <div class="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-lg flex justify-center">
                  @if (qrCode()) {
                    <img [src]="qrCode()" alt="QR Code" class="w-40 h-40" />
                  } @else {
                    <div class="w-40 h-40 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center">
                      <span class="text-neutral-400">Loading QR Code...</span>
                    </div>
                  }
                </div>

                <p class="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                  Scan this code with your authenticator app, or enter the setup key manually
                </p>

                @if (setupSecret()) {
                  <div class="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                    <p class="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Setup Key (if QR doesn't work):</p>
                    <p class="font-mono text-sm text-neutral-900 dark:text-white break-all">{{ setupSecret() }}</p>
                  </div>
                }

                <div>
                  <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Enter 6-digit code from app
                  </label>
                  <input
                    [(ngModel)]="verificationCode"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                      bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-center text-2xl tracking-widest
                      focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="000000"
                  />
                </div>

                <div class="flex gap-2">
                  <button
                    (click)="currentStep.set(1)"
                    class="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition font-medium"
                  >
                    Back
                  </button>
                  <button
                    (click)="verifyCode()"
                    [disabled]="verificationCode.length !== 6 || verifying()"
                    class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    {{ verifying() ? 'Verifying...' : 'Verify' }}
                  </button>
                </div>

                @if (verifyError()) {
                  <div class="p-3 bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded-lg">
                    <p class="text-sm text-danger-700 dark:text-danger-300">{{ verifyError() }}</p>
                  </div>
                }
              </div>
            }

            <!-- Step 3 -->
            @if (currentStep() === 3) {
              <div class="space-y-4">
                <div class="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                  <div class="flex-shrink-0 w-8 h-8 bg-success-600 text-white rounded-full flex items-center justify-center font-semibold">
                    ✓
                  </div>
                  <div>
                    <h3 class="font-semibold text-neutral-900 dark:text-white">Save Backup Codes</h3>
                  </div>
                </div>

                <div class="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 p-4 rounded-lg">
                  <p class="text-sm text-success-700 dark:text-success-300 mb-3">
                    ✓ 2FA has been enabled! Save your backup codes in a secure location.
                  </p>
                </div>

                <div>
                  <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Backup Codes:</p>
                  <div class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg font-mono text-sm space-y-1">
                    @for (code of backupCodes(); track code) {
                      <p class="text-neutral-900 dark:text-white">{{ code }}</p>
                    }
                  </div>
                </div>

                <div class="flex gap-2">
                  <button
                    (click)="copyBackupCodes()"
                    class="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition font-medium"
                  >
                    📋 Copy
                  </button>
                  <button
                    (click)="downloadBackupCodes()"
                    class="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition font-medium"
                  >
                    ⬇️ Download
                  </button>
                  <button
                    (click)="complete2FASetup()"
                    class="flex-1 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            }
          </app-card-body>
        </app-card>
      } @else {
        <!-- Enabled State -->
        <app-card>
          <app-card-header>
            <h2 class="font-semibold text-neutral-900 dark:text-white">Manage 2FA</h2>
          </app-card-header>
          <app-card-body class="space-y-4">
            <div class="p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
              <p class="text-success-700 dark:text-success-300">
                ✓ Two-factor authentication is enabled on your account
              </p>
            </div>

            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-white mb-2">Backup Codes</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                You have {{ twoFAStatus().backupCodesCount }} backup codes remaining
              </p>
              <button
                (click)="regenerateBackupCodes()"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Generate New Codes
              </button>
            </div>

            <hr class="border-neutral-200 dark:border-neutral-700" />

            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-white mb-2">Disable 2FA</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                You can disable 2FA if you no longer need it (not recommended)
              </p>
              <button
                (click)="disable2FA()"
                class="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition text-sm font-medium"
              >
                Disable 2FA
              </button>
            </div>
          </app-card-body>
        </app-card>
      }
    </div>
  `,
})
export class TwoFactorSetupComponent implements OnInit {
  private twoFAService = inject(TwoFactorAuthService);

  currentStep = signal(1);
  selectedMethod = signal<'totp' | 'sms'>('totp');
  qrCode = signal('');
  setupSecret = signal('');
  backupCodes = signal<string[]>([]);
  verificationCode = '';
  verifying = signal(false);
  verifyError = signal('');
  twoFAStatus = signal({
    enabled: false,
    method: null,
    verified: false,
    backupCodesCount: 0,
  });

  ngOnInit() {
    this.check2FAStatus();
  }

  check2FAStatus() {
    const userId = '1'; // Current user
    this.twoFAService.get2FAStatus(userId).subscribe({
      next: (status: any) => this.twoFAStatus.set(status),
    });
  }

  setupStep2() {
    this.verifyError.set('');
    const userId = '1';
    this.twoFAService.enable2FA(userId, this.selectedMethod()).subscribe({
      next: (data) => {
        this.qrCode.set(data.qrCode);
        this.setupSecret.set(data.secret);
        this.currentStep.set(2);
      },
      error: (err) => this.verifyError.set(err.message),
    });
  }

  verifyCode() {
    if (this.verificationCode.length !== 6) return;

    this.verifying.set(true);
    this.verifyError.set('');
    const userId = '1';

    this.twoFAService.verify2FA(userId, this.verificationCode).subscribe({
      next: (response) => {
        this.verifying.set(false);
        this.twoFAService.generateNewBackupCodes(userId).subscribe({
          next: (data) => {
            this.backupCodes.set(data.backupCodes);
            this.currentStep.set(3);
          },
        });
      },
      error: (err) => {
        this.verifyError.set('Invalid code. Please try again.');
        this.verifying.set(false);
      },
    });
  }

  regenerateBackupCodes() {
    if (!confirm('This will invalidate your existing backup codes. Continue?')) return;

    const userId = '1';
    this.twoFAService.generateNewBackupCodes(userId).subscribe({
      next: (data) => {
        this.backupCodes.set(data.backupCodes);
      },
    });
  }

  copyBackupCodes() {
    const text = this.backupCodes().join('\n');
    navigator.clipboard.writeText(text);
  }

  downloadBackupCodes() {
    const text = this.backupCodes().join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  complete2FASetup() {
    this.check2FAStatus();
    this.currentStep.set(1);
  }

  disable2FA() {
    if (!confirm('Are you sure? This will disable 2FA on your account.')) return;

    const userId = '1';
    this.twoFAService.disable2FA(userId).subscribe({
      next: () => this.check2FAStatus(),
    });
  }
}