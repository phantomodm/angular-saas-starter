import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { signal } from '@angular/core';
import { WebhooksService } from '../../../core/services/webhooks.service';
import { LoggingService } from '../../../core/services/logging.service';
import { Webhook, WebhookDelivery, WebhookEvent } from '../../../core/models/organization.model';

@Component({
  selector: 'app-webhooks-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 p-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">Webhooks</h1>
          <p class="text-neutral-600 dark:text-neutral-400 mt-1">
            Receive real-time notifications for events in your organization
          </p>
        </div>
        <button
          (click)="openCreateDialog()"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Create Webhook
        </button>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p class="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Total Webhooks</p>
          <p class="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
            {{ stats()?.totalWebhooks || 0 }}
          </p>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p class="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Active Webhooks</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {{ stats()?.activeWebhooks || 0 }}
          </p>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p class="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Total Deliveries</p>
          <p class="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
            {{ stats()?.totalDeliveries || 0 }}
          </p>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p class="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Success Rate</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {{ getSuccessRate() }}%
          </p>
        </div>
      </div>

      <!-- Webhooks List -->
      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">Webhooks</h2>
        </div>

        @if (webhooks().length === 0) {
          <div class="px-6 py-12 text-center">
            <p class="text-neutral-600 dark:text-neutral-400">No webhooks created yet</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Name
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    URL
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Events
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Deliveries
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (webhook of webhooks(); track webhook.id) {
                  <tr class="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-3 h-3 rounded-full"
                          [class.bg-green-500]="webhook.isActive"
                          [class.bg-neutral-400]="!webhook.isActive"
                        ></div>
                        <div>
                          <p class="font-medium text-neutral-900 dark:text-white">{{ webhook.name }}</p>
                          <p class="text-sm text-neutral-600 dark:text-neutral-400">{{ webhook.description }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-mono text-neutral-600 dark:text-neutral-400 truncate max-w-xs">
                        {{ webhook.url }}
                      </p>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-wrap gap-1">
                        @for (event of webhook.events | slice : 0 : 2; track event) {
                          <span
                            class="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                          >
                            {{ event }}
                          </span>
                        }
                        @if (webhook.events.length > 2) {
                          <span class="text-xs text-neutral-600 dark:text-neutral-400 py-1">
                            +{{ webhook.events.length - 2 }}
                          </span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                        [class.bg-green-100]="webhook.isActive"
                        [class.text-green-700]="webhook.isActive"
                        [class.dark:bg-green-900/30]="webhook.isActive"
                        [class.dark:text-green-300]="webhook.isActive"
                        [class.bg-neutral-100]="!webhook.isActive"
                        [class.text-neutral-700]="!webhook.isActive"
                        [class.dark:bg-neutral-700]="!webhook.isActive"
                        [class.dark:text-neutral-400]="!webhook.isActive"
                      >
                        {{ webhook.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm">
                        <p class="font-medium text-neutral-900 dark:text-white">
                          {{ webhook.totalDeliveries }}
                        </p>
                        <p class="text-neutral-600 dark:text-neutral-400">
                          {{ webhook.failedDeliveries }} failed
                        </p>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2">
                        <button
                          (click)="testWebhook(webhook.id)"
                          class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        >
                          Test
                        </button>
                        <button
                          (click)="editWebhook(webhook)"
                          class="px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          (click)="viewDeliveries(webhook.id)"
                          class="px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition"
                        >
                          Logs
                        </button>
                        <button
                          (click)="deleteWebhook(webhook.id)"
                          class="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition"
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

      <!-- Deliveries Log -->
      @if (showDeliveries()) {
        <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">
              Delivery Logs - {{ selectedWebhookName() }}
            </h2>
            <button
              (click)="showDeliveries.set(false)"
              class="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          <div class="p-6">
            <div class="mb-4 flex gap-2">
              <select
                [(ngModel)]="deliveryStatusFilter"
                class="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="retrying">Retrying</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            @if (filteredDeliveries().length === 0) {
              <p class="text-neutral-600 dark:text-neutral-400 text-center py-8">No deliveries</p>
            } @else {
              <div class="space-y-3 max-h-96 overflow-y-auto">
                @for (delivery of filteredDeliveries() | slice : 0 : 20; track delivery.id) {
                  <div class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <p class="font-medium text-neutral-900 dark:text-white">
                          {{ delivery.event }}
                        </p>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                          {{ delivery.createdAt | date : 'short' }}
                        </p>
                      </div>
                      <span
                        class="inline-block px-2 py-1 rounded text-xs font-medium"
                        [class.bg-green-100]="delivery.status === 'success'"
                        [class.text-green-700]="delivery.status === 'success'"
                        [class.dark:bg-green-900/30]="delivery.status === 'success'"
                        [class.dark:text-green-300]="delivery.status === 'success'"
                        [class.bg-red-100]="delivery.status === 'failed'"
                        [class.text-red-700]="delivery.status === 'failed'"
                        [class.dark:bg-red-900/30]="delivery.status === 'failed'"
                        [class.dark:text-red-300]="delivery.status === 'failed'"
                        [class.bg-yellow-100]="delivery.status === 'retrying'"
                        [class.text-yellow-700]="delivery.status === 'retrying'"
                        [class.dark:bg-yellow-900/30]="delivery.status === 'retrying'"
                        [class.dark:text-yellow-300]="delivery.status === 'retrying'"
                      >
                        {{ delivery.status | uppercase }}
                      </span>
                    </div>
                    <div class="text-sm space-y-1">
                      <p class="text-neutral-600 dark:text-neutral-400">
                        Response: {{ delivery.statusCode }} ({{ delivery.responseTime }}ms)
                      </p>
                      @if (delivery.error) {
                        <p class="text-red-600 dark:text-red-300">Error: {{ delivery.error }}</p>
                      }
                    </div>
                    @if (delivery.status === 'failed' && delivery.retryCount < 3) {
                      <button
                        (click)="retryDelivery(delivery.id)"
                        class="mt-2 px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 transition"
                      >
                        Retry
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Create/Edit Webhook Dialog -->
      @if (showDialog()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-800">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">
                {{ editingWebhook() ? 'Edit Webhook' : 'Create Webhook' }}
              </h2>
              <button
                (click)="closeDialog()"
                class="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="webhookForm" (ngSubmit)="saveWebhook()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Webhook Name *
                </label>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="My Integration"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  formControlName="description"
                  placeholder="What is this webhook for?"
                  rows="2"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  formControlName="url"
                  placeholder="https://example.com/webhook"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Events *
                </label>
                <div class="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  @for (event of availableEvents; track event) {
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [value]="event"
                        (change)="toggleEvent($event, event)"
                        [checked]="selectedEvents().includes(event)"
                        class="w-4 h-4 rounded"
                      />
                      <span class="text-sm text-neutral-700 dark:text-neutral-300">{{ event }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="flex items-center gap-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    formControlName="isActive"
                    class="w-4 h-4 rounded"
                  />
                  <span class="text-sm text-neutral-700 dark:text-neutral-300">Active</span>
                </label>
              </div>

              <div class="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  (click)="closeDialog()"
                  class="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!webhookForm.valid"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ editingWebhook() ? 'Update' : 'Create' }}
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
export class WebhooksManagementComponent implements OnInit {
  webhooks = signal<Webhook[]>([]);
  selectedWebhook = signal<Webhook | null>(null);
  deliveries = signal<WebhookDelivery[]>([]);
  stats = signal<any>(null);
  showDialog = signal(false);
  showDeliveries = signal(false);
  selectedWebhookName = signal('');
  selectedEvents = signal<WebhookEvent[]>([]);
  editingWebhook = signal<Webhook | null>(null);

  webhookForm!: FormGroup;
  availableEvents: WebhookEvent[] = [];
  deliveryStatusFilter = '';

  get filteredDeliveries(): () => WebhookDelivery[] {
    return () => {
      let filtered = this.deliveries();
      if (this.deliveryStatusFilter) {
        filtered = filtered.filter(
          (d) => d.status === (this.deliveryStatusFilter as any)
        );
      }
      return filtered;
    };
  }

  constructor(
    private webhooksService: WebhooksService,
    private logging: LoggingService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadWebhooks();
    this.loadStats();
    this.availableEvents = this.webhooksService.getAvailableEvents();
  }

  private initializeForm(): void {
    this.webhookForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      isActive: [true],
    });
  }

  private loadWebhooks(): void {
    this.webhooksService.getWebhooks('org_1').subscribe({
      next: (webhooks) => {
        this.webhooks.set(webhooks);
      },
    });
  }

  private loadStats(): void {
    this.webhooksService.getWebhookStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
    });
  }

  openCreateDialog(): void {
    this.editingWebhook.set(null);
    this.selectedEvents.set([]);
    this.webhookForm.reset({ isActive: true });
    this.showDialog.set(true);
  }

  editWebhook(webhook: Webhook): void {
    this.editingWebhook.set(webhook);
    this.selectedEvents.set(webhook.events);
    this.webhookForm.patchValue({
      name: webhook.name,
      description: webhook.description,
      url: webhook.url,
      isActive: webhook.isActive,
    });
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.editingWebhook.set(null);
    this.selectedEvents.set([]);
    this.webhookForm.reset();
  }

  toggleEvent(event: any, eventType: WebhookEvent): void {
    const selected = this.selectedEvents();
    if (event.target.checked) {
      this.selectedEvents.set([...selected, eventType]);
    } else {
      this.selectedEvents.set(selected.filter((e) => e !== eventType));
    }
  }

  saveWebhook(): void {
    if (!this.webhookForm.valid || this.selectedEvents().length === 0) {
      return;
    }

    const formValue = this.webhookForm.value;
    const webhookData = {
      ...formValue,
      events: this.selectedEvents(),
      organizationId: 'org_1',
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 5000,
        exponentialBackoff: true,
      },
    };

    const request = this.editingWebhook()
      ? this.webhooksService.updateWebhook(this.editingWebhook()!.id, webhookData)
      : this.webhooksService.createWebhook('org_1', webhookData);

    request.subscribe({
      next: () => {
        this.loadWebhooks();
        this.loadStats();
        this.closeDialog();
      },
      error: (err) => {
        this.logging.error('Failed to save webhook', 'ADMIN', { error: err });
      },
    });
  }

  deleteWebhook(webhookId: string): void {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    this.webhooksService.deleteWebhook(webhookId).subscribe({
      next: () => {
        this.loadWebhooks();
        this.loadStats();
      },
      error: (err) => {
        this.logging.error('Failed to delete webhook', 'ADMIN', { error: err });
      },
    });
  }

  testWebhook(webhookId: string): void {
    this.webhooksService.testWebhook(webhookId).subscribe({
      next: (delivery) => {
        this.logging.info('Webhook test sent', 'ADMIN', {
          webhookId,
          deliveryId: delivery.id,
        });
        alert(`Test sent! Status: ${delivery.statusCode} (${delivery.responseTime}ms)`);
      },
      error: (err) => {
        this.logging.error('Failed to test webhook', 'ADMIN', { error: err });
      },
    });
  }

  viewDeliveries(webhookId: string): void {
    const webhook = this.webhooks().find((w) => w.id === webhookId);
    if (!webhook) return;

    this.selectedWebhookName.set(webhook.name);
    this.deliveryStatusFilter = '';

    this.webhooksService.getDeliveries(webhookId).subscribe({
      next: (deliveries) => {
        this.deliveries.set(deliveries);
        this.showDeliveries.set(true);
      },
    });
  }

  retryDelivery(deliveryId: string): void {
    this.webhooksService.retryDelivery(deliveryId).subscribe({
      next: (delivery) => {
        this.deliveries.update((deliveries) =>
          deliveries.map((d) => (d.id === deliveryId ? delivery : d))
        );
      },
    });
  }

  getSuccessRate(): number {
    const stat = this.stats();
    if (!stat || stat.totalDeliveries === 0) return 100;
    return Math.round((stat.successfulDeliveries / stat.totalDeliveries) * 100);
  }
}
