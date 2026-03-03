import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../../core/services/billing';
import { OrganizationService } from '../../../core/services/organization';
import {
  BillingSubscription,
  BillingPlan,
  Invoice,
  PaymentMethod,
  UsageMetrics,
} from '../../../core/models/organization.model';
import { signal } from '@angular/core';
import { CardComponent, CardBodyComponent, CardHeaderComponent } from '../../../shared/ui/card.component';

@Component({
  selector: 'app-subscription-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, CardBodyComponent, CardHeaderComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">Billing & Subscriptions</h1>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      <!-- Current Subscription -->
      @if (currentSubscription()) {
        <app-card>
          <app-card-header>
            <h2 class="font-semibold text-neutral-900 dark:text-white">Current Plan</h2>
          </app-card-header>
          <app-card-body class="space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-2xl font-bold text-neutral-900 dark:text-white">{{ currentSubscription()!.planName }}</p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Renews {{ currentSubscription()!.currentPeriodEnd | date: 'long' }}
                </p>
              </div>
              <div>
                <span
                  [class]="{
                    'bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300': currentSubscription()!.status === 'active',
                    'bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300': currentSubscription()!.status === 'paused',
                    'bg-danger-100 dark:bg-danger-900 text-danger-700 dark:text-danger-300': currentSubscription()!.status === 'canceled',
                  }"
                  class="px-3 py-1 rounded-full text-sm font-medium"
                >
                  {{ currentSubscription()!.status }}
                </span>
              </div>
            </div>

            <!-- Usage Metrics -->
            @if (usageMetrics()) {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400 uppercase font-semibold">API Calls</p>
                  <p class="text-xl font-bold text-neutral-900 dark:text-white mt-1">
                    {{ (usageMetrics()!.apiCallsUsed / 1000) | number: '0.0' }}K / {{ (usageMetrics()!.apiCallsLimit / 1000) | number: '0.0' }}K
                  </p>
                  <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mt-2">
                    <div
                      [style.width.%]="(usageMetrics()!.apiCallsUsed / usageMetrics()!.apiCallsLimit) * 100"
                      class="bg-primary-600 h-2 rounded-full"
                    ></div>
                  </div>
                </div>
                <div>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400 uppercase font-semibold">Team Members</p>
                  <p class="text-xl font-bold text-neutral-900 dark:text-white mt-1">
                    {{ usageMetrics()!.usersUsed }} / {{ usageMetrics()!.usersLimit }}
                  </p>
                  <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mt-2">
                    <div
                      [style.width.%]="(usageMetrics()!.usersUsed / usageMetrics()!.usersLimit) * 100"
                      class="bg-success-600 h-2 rounded-full"
                    ></div>
                  </div>
                </div>
              </div>
            }

            @if (currentSubscription()!.status === 'active') {
              <div class="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  (click)="showPlanSelector.set(true)"
                  class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
                >
                  Change Plan
                </button>
                <button
                  (click)="pauseSubscription()"
                  class="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition font-medium text-sm"
                >
                  Pause
                </button>
                <button
                  (click)="cancelSubscription()"
                  class="flex-1 px-4 py-2 border border-danger-300 text-danger-600 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            }
          </app-card-body>
        </app-card>
      }

      <!-- Plan Selector -->
      @if (showPlanSelector()) {
        <app-card>
          <app-card-header>
            <h2 class="font-semibold text-neutral-900 dark:text-white">Select a Plan</h2>
          </app-card-header>
          <app-card-body>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              @for (plan of allPlans(); track plan.id) {
                <div
                  [class.ring-2]="currentSubscription()?.planId === plan.id"
                  [class.ring-primary-600]="currentSubscription()?.planId === plan.id"
                  class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition"
                >
                  <h3 class="text-lg font-bold text-neutral-900 dark:text-white">{{ plan.name }}</h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{{ plan.description }}</p>

                  <div class="mt-4">
                    <p class="text-3xl font-bold text-neutral-900 dark:text-white">
                      <span>\$</span>{{ plan.monthlyPrice }}
                    </p>
                    <p class="text-xs text-neutral-600 dark:text-neutral-400">/month</p>
                  </div>

                  <ul class="mt-4 space-y-2">
                    @for (feature of plan.features | slice: 0: 3; track feature.id) {
                      <li class="text-xs text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                        <span class="text-success-600">✓</span> {{ feature.name }}
                      </li>
                    }
                  </ul>

                  @if (currentSubscription()?.planId !== plan.id) {
                    <button
                      (click)="selectPlan(plan.id)"
                      class="w-full mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
                    >
                      Select Plan
                    </button>
                  } @else {
                    <div class="w-full mt-6 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg text-center font-medium text-sm">
                      Current Plan
                    </div>
                  }
                </div>
              }
            </div>
          </app-card-body>
        </app-card>
      }

      <!-- Payment Method -->
      @if (paymentMethods()) {
        <app-card>
          <app-card-header class="flex justify-between items-center">
            <h2 class="font-semibold text-neutral-900 dark:text-white">Payment Method</h2>
            <button
              class="px-3 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition"
            >
              Add
            </button>
          </app-card-header>
          @if (paymentMethods()!.length > 0) {
            <div class="divide-y divide-neutral-200 dark:divide-neutral-700">
              @for (method of paymentMethods()!; track method.id) {
                <div class="px-6 py-4 flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center text-sm font-semibold">
                      💳
                    </div>
                    <div>
                      <p class="font-medium text-neutral-900 dark:text-white">{{ method.cardBrand | uppercase }}</p>
                      <p class="text-xs text-neutral-600 dark:text-neutral-400">
                        •••• •••• •••• {{ method.cardLast4 }} • Expires {{ method.cardExpMonth }}/{{ method.cardExpYear }}
                      </p>
                    </div>
                  </div>
                  @if (method.isDefault) {
                    <span class="px-2 py-1 bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 rounded text-xs font-medium">
                      Default
                    </span>
                  }
                </div>
              }
            </div>
          } @else {
            <app-card-body>
              <p class="text-center text-neutral-600 dark:text-neutral-400 py-6">
                No payment methods yet. Add one to manage billing.
              </p>
            </app-card-body>
          }
        </app-card>
      }

      <!-- Invoices -->
      <app-card>
        <app-card-header title="Recent Invoices"></app-card-header>
        @if (invoices().length === 0) {
          <app-card-body>
            <p class="text-center text-neutral-600 dark:text-neutral-400 py-6">No invoices yet</p>
          </app-card-body>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Invoice
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Date
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Amount
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                @for (invoice of invoices(); track invoice.id) {
                  <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                    <td class="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">
                      {{ invoice.id }}
                    </td>
                    <td class="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {{ invoice.issuedAt | date: 'short' }}
                    </td>
                    <td class="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">
                      {{ invoice.currency }} {{ (invoice.amount / 100) | number: '1.2' }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        [class]="{
                          'bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300': invoice.status === 'paid',
                          'bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300': invoice.status === 'sent',
                          'bg-danger-100 dark:bg-danger-900 text-danger-700 dark:text-danger-300': invoice.status === 'failed',
                        }"
                        class="px-2 py-1 rounded text-xs font-medium"
                      >
                        {{ invoice.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <button
                        (click)="downloadInvoice(invoice.id)"
                        class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </app-card>
    </div>
  `,
})
export class SubscriptionManagerComponent implements OnInit {
  private billingService = inject(BillingService);
  private orgService = inject(OrganizationService);

  currentSubscription = signal<BillingSubscription | null>(null);
  allPlans = signal<BillingPlan[]>([]);
  invoices = signal<Invoice[]>([]);
  paymentMethods = signal<PaymentMethod[]>([]);
  usageMetrics = signal<UsageMetrics | null>(null);
  showPlanSelector = signal(false);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.billingService.getSubscription('org_1').subscribe((sub) => {
      this.currentSubscription.set(sub);
    });

    this.orgService.getPlans().subscribe((plans) => {
      this.allPlans.set(plans);
    });

    this.billingService.getInvoices('org_1').subscribe((response) => {
      this.invoices.set(response.data);
    });

    this.billingService.getPaymentMethods('org_1').subscribe((methods) => {
      this.paymentMethods.set(methods);
    });

    this.billingService.getUsageMetrics('org_1').subscribe((metrics) => {
      this.usageMetrics.set(metrics);
    });
  }

  selectPlan(planId: string) {
    if (!this.currentSubscription()) return;

    this.billingService
      .changePlan(this.currentSubscription()!.id, planId)
      .subscribe((updated) => {
        this.currentSubscription.set(updated);
        this.showPlanSelector.set(false);
      });
  }

  pauseSubscription() {
    if (!this.currentSubscription()) return;
    this.billingService.pauseSubscription(this.currentSubscription()!.id).subscribe((updated) => {
      this.currentSubscription.set(updated);
    });
  }

  cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    if (!this.currentSubscription()) return;

    this.billingService
      .cancelSubscription(this.currentSubscription()!.id, 'User requested')
      .subscribe((updated) => {
        this.currentSubscription.set(updated);
      });
  }

  downloadInvoice(invoiceId: string) {
    this.billingService.downloadInvoicePDF(invoiceId).subscribe((data) => {
      window.open(data.url, '_blank');
    });
  }
}