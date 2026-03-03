import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { signal } from '@angular/core';
import { ApiQuota, RateLimitRecord } from '../../../core/models/organization.model';
import { LoggingService } from '../../../core/services/logging.service';
import { RateLimitingService } from '../../../core/services/rate-limiting';

@Component({
  selector: 'app-rate-limiting-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 p-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">API Rate Limiting</h1>
          <p class="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage quotas and monitor rate limit violations
          </p>
        </div>
        <button
          (click)="openCreateQuotaDialog()"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Create Quota
        </button>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p class="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Total Quotas</p>
          <p class="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
            {{ quotas().length }}
          </p>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p class="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Active Quotas</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {{ getActiveQuotasCount() }}
          </p>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p class="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Rate Limit Violations</p>
          <p class="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
            {{ rateLimitStats()?.blockedRequests || 0 }}
          </p>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p class="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Block Rate</p>
          <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
            {{ rateLimitStats()?.blockPercentage || 0 }}%
          </p>
        </div>
      </div>

      <!-- Quotas Section -->
      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">API Quotas</h2>
        </div>

        @if (quotas().length === 0) {
          <div class="px-6 py-12 text-center">
            <p class="text-neutral-600 dark:text-neutral-400">No quotas configured</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    API Key
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Type
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Usage
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Progress
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Reset At
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Status
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (quota of quotas(); track quota.id) {
                  <tr class="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td class="px-6 py-4">
                      <p class="text-sm font-mono text-neutral-900 dark:text-white">{{ quota.apiKeyId }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                        {{ quota.quotaType | uppercase }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-medium text-neutral-900 dark:text-white">
                        {{ quota.currentUsage }} / {{ quota.limit }} {{ quota.quotaType === 'storage' ? 'MB' : '' }}
                      </p>
                    </td>
                    <td class="px-6 py-4">
                      <div class="w-32">
                        <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                          <div
                            class="h-full transition-all"
                            [class.bg-green-500]="getUsagePercentage(quota) < 70"
                            [class.bg-yellow-500]="getUsagePercentage(quota) >= 70 && getUsagePercentage(quota) < 90"
                            [class.bg-red-500]="getUsagePercentage(quota) >= 90"
                            [style.width.%]="getUsagePercentage(quota)"
                          ></div>
                        </div>
                        <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                          {{ getUsagePercentage(quota) }}%
                        </p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ quota.resetAt | date : 'short' }}
                      </p>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                        [class.bg-green-100]="quota.isActive"
                        [class.text-green-700]="quota.isActive"
                        [class.dark:bg-green-900/30]="quota.isActive"
                        [class.dark:text-green-300]="quota.isActive"
                        [class.bg-neutral-100]="!quota.isActive"
                        [class.text-neutral-700]="!quota.isActive"
                        [class.dark:bg-neutral-700]="!quota.isActive"
                        [class.dark:text-neutral-400]="!quota.isActive"
                      >
                        {{ quota.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2">
                        <button
                          (click)="editQuota(quota)"
                          class="px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          (click)="resetQuota(quota.id)"
                          class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 transition"
                        >
                          Reset
                        </button>
                        <button
                          (click)="deleteQuota(quota.id)"
                          class="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Rate Limit Records -->
      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">Recent Rate Limit Records</h2>
        </div>

        <div class="p-6">
          <div class="mb-4">
            <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
              Filter by Status:
            </label>
            <select
              [(ngModel)]="statusFilter"
              class="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded"
            >
              <option value="">All</option>
              <option value="blocked">Blocked Only</option>
              <option value="allowed">Allowed Only</option>
            </select>
          </div>

          @if (getFilteredRateLimitRecords().length === 0) {
            <p class="text-neutral-600 dark:text-neutral-400 text-center py-8">No records</p>
          } @else {
            <div class="space-y-3">
              @for (record of getFilteredRateLimitRecords() | slice : 0 : 20; track record.id) {
                <div
                  class="border rounded-lg p-4"
                  [class.border-red-200]="record.isBlocked"
                  [class.dark:border-red-900/30]="record.isBlocked"
                  [class.bg-red-50]="record.isBlocked"
                  [class.dark:bg-red-900/10]="record.isBlocked"
                  [class.border-green-200]="!record.isBlocked"
                  [class.dark:border-green-900/30]="!record.isBlocked"
                  [class.bg-green-50]="!record.isBlocked"
                  [class.dark:bg-green-900/10]="!record.isBlocked"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <p class="font-medium text-neutral-900 dark:text-white">{{ record.endpoint }}</p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ record.windowStart | date : 'short' }} -
                        {{ record.windowEnd | date : 'short' }}
                      </p>
                    </div>
                    <span
                      class="inline-block px-2 py-1 rounded text-xs font-medium"
                      [class.bg-red-200]="record.isBlocked"
                      [class.text-red-700]="record.isBlocked"
                      [class.dark:bg-red-900/50]="record.isBlocked"
                      [class.dark:text-red-300]="record.isBlocked"
                      [class.bg-green-200]="!record.isBlocked"
                      [class.text-green-700]="!record.isBlocked"
                      [class.dark:bg-green-900/50]="!record.isBlocked"
                      [class.dark:text-green-300]="!record.isBlocked"
                    >
                      {{ record.isBlocked ? 'BLOCKED' : 'ALLOWED' }}
                    </span>
                  </div>
                  <div class="text-sm space-y-1">
                    <p class="text-neutral-600 dark:text-neutral-400">
                      Requests: <span class="font-medium text-neutral-900 dark:text-white">{{ record.requestCount }}</span>
                    </p>
                    @if (record.apiKeyId) {
                      <p class="text-neutral-600 dark:text-neutral-400">
                        API Key: <span class="font-mono text-xs">{{ record.apiKeyId }}</span>
                      </p>
                    }
                    @if (record.ipAddress) {
                      <p class="text-neutral-600 dark:text-neutral-400">
                        IP: <span class="font-mono">{{ record.ipAddress }}</span>
                      </p>
                    }
                    @if (record.blockReason) {
                      <p class="text-red-600 dark:text-red-300 font-medium">
                        {{ record.blockReason }}
                      </p>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Top Blocked Endpoints -->
      @if (rateLimitStats()?.topBlockedEndpoints) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Top Blocked Endpoints</h3>
            <div class="space-y-3">
              @for (endpoint of rateLimitStats()!.topBlockedEndpoints; track endpoint.endpoint) {
                <div class="flex justify-between items-center">
                  <p class="text-sm font-mono text-neutral-600 dark:text-neutral-400">{{ endpoint.endpoint }}</p>
                  <span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                    {{ endpoint.count }}
                  </span>
                </div>
              }
            </div>
          </div>

          <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Top Blocked API Keys</h3>
            <div class="space-y-3">
              @for (apiKey of rateLimitStats()!.topBlockedApiKeys; track apiKey.apiKeyId) {
                <div class="flex justify-between items-center">
                  <p class="text-sm font-mono text-neutral-600 dark:text-neutral-400">
                    {{ apiKey.apiKeyId || 'Anonymous' }}
                  </p>
                  <span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                    {{ apiKey.count }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Quota Dialog -->
      @if (showQuotaDialog()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-neutral-800 rounded-lg max-w-md w-full">
            <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">
                {{ editingQuota() ? 'Edit Quota' : 'Create Quota' }}
              </h2>
              <button
                (click)="closeQuotaDialog()"
                class="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="quotaForm" (ngSubmit)="saveQuota()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  API Key *
                </label>
                <input
                  type="text"
                  formControlName="apiKeyId"
                  placeholder="key_abc123"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Quota Type *
                </label>
                <select
                  formControlName="quotaType"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                >
                  <option value="requests">Requests</option>
                  <option value="storage">Storage (MB)</option>
                  <option value="bandwidth">Bandwidth</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Limit *
                </label>
                <input
                  type="number"
                  formControlName="limit"
                  placeholder="1000"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Period *
                </label>
                <select
                  formControlName="period"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                >
                  <option value="minute">Per Minute</option>
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                  <option value="month">Per Month</option>
                </select>
              </div>

              <div class="flex items-center gap-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="isActive" class="w-4 h-4 rounded" />
                  <span class="text-sm text-neutral-700 dark:text-neutral-300">Active</span>
                </label>
              </div>

              <div class="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  (click)="closeQuotaDialog()"
                  class="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!quotaForm.valid"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {{ editingQuota() ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class RateLimitingDashboardComponent implements OnInit {
  quotas = signal<ApiQuota[]>([]);
  rateLimitRecords = signal<RateLimitRecord[]>([]);
  rateLimitStats = signal<any>(null);
  showQuotaDialog = signal(false);
  editingQuota = signal<ApiQuota | null>(null);

  quotaForm!: FormGroup;
  statusFilter = '';

  constructor(
    private rateLimitingService: RateLimitingService,
    private logging: LoggingService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadQuotas();
    this.loadRateLimitRecords();
    this.loadStats();
  }

  private initializeForm(): void {
    this.quotaForm = this.fb.group({
      apiKeyId: ['', Validators.required],
      quotaType: ['requests', Validators.required],
      limit: [1000, Validators.required],
      period: ['hour', Validators.required],
      isActive: [true],
    });
  }

  private loadQuotas(): void {
    this.rateLimitingService.getQuotas('org_1').subscribe({
      next: (quotas) => this.quotas.set(quotas),
    });
  }

  private loadRateLimitRecords(): void {
    this.rateLimitingService.getRateLimitRecords('org_1').subscribe({
      next: (records) => this.rateLimitRecords.set(records),
    });
  }

  private loadStats(): void {
    this.rateLimitingService.getRateLimitingStats().subscribe({
      next: (stats) => this.rateLimitStats.set(stats),
    });
  }

  getActiveQuotasCount(): number {
    return this.quotas().filter((q) => q.isActive).length;
  }

  getUsagePercentage(quota: ApiQuota): number {
    return Math.round((quota.currentUsage / quota.limit) * 100);
  }

  getFilteredRateLimitRecords(): RateLimitRecord[] {
    let records = this.rateLimitRecords();
    if (this.statusFilter === 'blocked') {
      records = records.filter((r) => r.isBlocked);
    } else if (this.statusFilter === 'allowed') {
      records = records.filter((r) => !r.isBlocked);
    }
    return records;
  }

  openCreateQuotaDialog(): void {
    this.editingQuota.set(null);
    this.quotaForm.reset({ isActive: true, quotaType: 'requests', period: 'hour', limit: 1000 });
    this.showQuotaDialog.set(true);
  }

  editQuota(quota: ApiQuota): void {
    this.editingQuota.set(quota);
    this.quotaForm.patchValue({
      apiKeyId: quota.apiKeyId,
      quotaType: quota.quotaType,
      limit: quota.limit,
      period: quota.period,
      isActive: quota.isActive,
    });
    this.showQuotaDialog.set(true);
  }

  closeQuotaDialog(): void {
    this.showQuotaDialog.set(false);
    this.editingQuota.set(null);
    this.quotaForm.reset();
  }

  saveQuota(): void {
    if (!this.quotaForm.valid) return;

    const request = this.editingQuota()
      ? this.rateLimitingService.updateQuota(this.editingQuota()!.id, this.quotaForm.value)
      : this.rateLimitingService.createQuota({
          ...this.quotaForm.value,
          organizationId: 'org_1',
          currentUsage: 0,
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

    request.subscribe({
      next: () => {
        this.loadQuotas();
        this.loadStats();
        this.closeQuotaDialog();
      },
      error: (err) => this.logging.error('Failed to save quota', 'ADMIN', { error: err }),
    });
  }

  deleteQuota(quotaId: string): void {
    if (!confirm('Are you sure?')) return;

    this.rateLimitingService.deleteQuota(quotaId).subscribe({
      next: () => {
        this.loadQuotas();
        this.loadStats();
      },
      error: (err) => this.logging.error('Failed to delete quota', 'ADMIN', { error: err }),
    });
  }

  resetQuota(quotaId: string): void {
    this.rateLimitingService.resetQuotaUsage(quotaId).subscribe({
      next: () => {
        this.loadQuotas();
        this.logging.info('Quota reset', 'ADMIN', { quotaId });
      },
      error: (err) => this.logging.error('Failed to reset quota', 'ADMIN', { error: err }),
    });
  }
}