import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  status: 'active' | 'revoked';
  scopes: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  revealed?: boolean;
}

@Component({
  selector: 'app-api-keys',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="section-header">API Keys</h1>
          <p class="section-subheader mt-2">Manage your API credentials and authentication tokens</p>
        </div>
        <button
          (click)="showCreateForm.set(true)"
          class="btn-primary"
          >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create New Key
        </button>
      </div>
    
      <!-- Create Key Form -->
      @if (showCreateForm()) {
        <div class="card border-2 border-primary-200 dark:border-primary-800">
          <div class="card-header bg-primary-50 dark:bg-primary-950">
            <h2 class="font-semibold text-primary-900 dark:text-primary-50">Create New API Key</h2>
          </div>
          <form (ngSubmit)="createKey()" class="card-body space-y-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Key Name
              </label>
              <input
                type="text"
                [(ngModel)]="newKeyName"
                name="newKeyName"
                class="input-field"
                placeholder="e.g., Production Server, Mobile App"
                required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Scopes (Permissions)
                </label>
                <div class="space-y-2">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="scopes['read']" name="read" class="w-4 h-4" />
                    <span class="text-sm text-neutral-700 dark:text-neutral-300">Read Data</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="scopes['write']" name="write" class="w-4 h-4" />
                    <span class="text-sm text-neutral-700 dark:text-neutral-300">Write Data</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="scopes['admin']" name="admin" class="w-4 h-4" />
                    <span class="text-sm text-neutral-700 dark:text-neutral-300">Admin Access</span>
                  </label>
                </div>
              </div>
              <div class="flex gap-3 pt-4">
                <button type="submit" class="btn-primary flex-1">
                  Create Key
                </button>
                <button type="button" (click)="showCreateForm.set(false)" class="btn-ghost flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        }
    
        <!-- Success Message -->
        @if (showSuccessMessage()) {
          <div class="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg dark:bg-success-900/20 dark:border-success-800 dark:text-success-200">
            <p class="font-medium">{{ successMessage() }}</p>
          </div>
        }
    
        <!-- API Keys List -->
        <div class="space-y-4">
          @for (apiKey of apiKeys(); track apiKey) {
            <div class="card hover:shadow-md transition-shadow">
              <div class="card-body">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="font-semibold text-neutral-900 dark:text-neutral-50">{{ apiKey.name }}</h3>
                    <p class="text-sm text-muted mt-1">Created {{ formatDate(apiKey.createdAt) }}</p>
                  </div>
                  <span
                    [ngClass]="apiKey.status === 'active' ? 'badge-success' : 'badge-danger'"
                    class="badge"
                    >
                    {{ apiKey.status | uppercase }}
                  </span>
                </div>
                <!-- Key Display -->
                <div class="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 font-mono text-sm mb-4 flex items-center justify-between">
                  @if (!apiKey.revealed) {
                    <code class="text-neutral-600 dark:text-neutral-400">
                      {{ apiKey.maskedKey }}
                    </code>
                  }
                  @if (apiKey.revealed) {
                    <code class="text-success-600 dark:text-success-400 break-all">
                      {{ apiKey.key }}
                    </code>
                  }
                  @if (!apiKey.revealed) {
                    <button
                      type="button"
                      (click)="revealKey(apiKey)"
                      class="text-primary-600 hover:text-primary-700 text-xs font-medium ml-4 whitespace-nowrap dark:text-primary-400"
                      >
                      Reveal
                    </button>
                  }
                  @if (apiKey.revealed) {
                    <button
                      type="button"
                      (click)="copyToClipboard(apiKey.key)"
                      class="text-primary-600 hover:text-primary-700 text-xs font-medium ml-4 whitespace-nowrap dark:text-primary-400"
                      >
                      Copy
                    </button>
                  }
                </div>
                <!-- Scopes -->
                <div class="mb-4">
                  <p class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">Scopes:</p>
                  <div class="flex gap-2 flex-wrap">
                    @for (scope of apiKey.scopes; track scope) {
                      <span class="badge-primary">
                        {{ scope }}
                      </span>
                    }
                  </div>
                </div>
                <!-- Last Used -->
                <p class="text-xs text-muted mb-4">
                  Last used: {{ apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never' }}
                </p>
                <!-- Actions -->
                @if (apiKey.status === 'active') {
                  <div class="flex gap-2">
                    <button
                      type="button"
                      (click)="revokeKey(apiKey)"
                      class="btn-danger text-sm"
                      >
                      Revoke
                    </button>
                  </div>
                }
              </div>
            </div>
          }
    
          <!-- Empty State -->
          @if (apiKeys().length === 0 && !showCreateForm()) {
            <div class="card text-center py-12">
              <svg class="w-12 h-12 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">No API Keys</h3>
              <p class="text-muted mb-4">Create your first API key to get started</p>
              <button (click)="showCreateForm.set(true)" class="btn-primary mx-auto">
                Create API Key
              </button>
            </div>
          }
        </div>
    
        <!-- Security Notice -->
        <div class="bg-warning-50 border border-warning-200 rounded-lg p-4 dark:bg-warning-900/20 dark:border-warning-800">
          <div class="flex gap-3">
            <svg class="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div>
              <h4 class="font-semibold text-warning-900 dark:text-warning-200 mb-1">Keep your keys secure</h4>
              <p class="text-sm text-warning-800 dark:text-warning-300">
                Treat API keys like passwords. Never share them or commit them to version control. Revoke compromised keys immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
})
export class ApiKeysComponent {
  showCreateForm = signal(false);
  showSuccessMessage = signal(false);
  successMessage = signal('');
  newKeyName = signal('');
  scopes: Record<string, boolean> = { read: true, write: false, admin: false };

  apiKeys = signal<ApiKey[]>([
    {
      id: '1',
      name: 'Production Server',
      key: 'sk_live_51L8w4LKVjS7x4c5e9e8w7r6t5y4u3i2o1p',
      maskedKey: 'sk_live_••••••••••••••••••••',
      status: 'active',
      scopes: ['read', 'write'],
      createdAt: new Date('2024-03-15'),
      lastUsedAt: new Date(),
    },
    {
      id: '2',
      name: 'Testing Key',
      key: 'sk_test_51M9w4LKVjS7x4c5e9e8w7r6t5y4u3i2o1p',
      maskedKey: 'sk_test_••••••••••••••••••••',
      status: 'active',
      scopes: ['read'],
      createdAt: new Date('2024-02-10'),
      lastUsedAt: new Date('2024-05-01'),
    },
    {
      id: '3',
      name: 'Old Development Key',
      key: 'sk_test_51N9w4LKVjS7x4c5e9e8w7r6t5y4u3i2o1p',
      maskedKey: 'sk_test_••••••••••••••••••••',
      status: 'revoked',
      scopes: ['read', 'write'],
      createdAt: new Date('2024-01-05'),
    },
  ]);

  createKey() {
    const scopeList = Object.keys(this.scopes).filter((key) => this.scopes[key]);

    const newKey: ApiKey = {
      id: Math.random().toString(36).substr(2, 9),
      name: this.newKeyName(),
      key: this.generateKey(),
      maskedKey: 'sk_live_' + '•'.repeat(20),
      status: 'active',
      scopes: scopeList,
      createdAt: new Date(),
      revealed: true, // Show new key once
    };

    this.apiKeys.update((keys) => [newKey, ...keys]);
    this.showCreateForm.set(false);
    this.newKeyName.set('');
    this.scopes = { read: true, write: false, admin: false };

    this.successMessage.set(`API key "${newKey.name}" created successfully! Copy it now, as it won't be shown again.`);
    this.showSuccessMessage.set(true);

    setTimeout(() => this.showSuccessMessage.set(false), 5000);
  }

  revealKey(apiKey: ApiKey) {
    apiKey.revealed = true;
  }

  revokeKey(apiKey: ApiKey) {
    if (confirm(`Are you sure you want to revoke "${apiKey.name}"? This action cannot be undone.`)) {
      apiKey.status = 'revoked';
      this.successMessage.set(`API key "${apiKey.name}" has been revoked.`);
      this.showSuccessMessage.set(true);
      setTimeout(() => this.showSuccessMessage.set(false), 5000);
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.successMessage.set('API key copied to clipboard!');
      this.showSuccessMessage.set(true);
      setTimeout(() => this.showSuccessMessage.set(false), 3000);
    });
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      }
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }

    return date.toLocaleDateString();
  }

  private generateKey(): string {
    const prefix = 'sk_live_';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = prefix;
    for (let i = 0; i < 24; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }
}
