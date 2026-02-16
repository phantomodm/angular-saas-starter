import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, CardBodyComponent } from '../../../shared/ui/card.component';

interface Invoice {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  downloadUrl: string;
}

interface Plan {
  name: string;
  price: number;
  description: string;
  features: string[];
  isCurrent: boolean;
  ctaLabel: string;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, CardComponent, CardBodyComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="section-header">Billing & Subscriptions</h1>
        <p class="section-subheader mt-2">Manage your subscription, payment methods, and invoices</p>
      </div>

      <!-- Current Subscription -->
      <app-card class="border-2 border-primary-200 dark:border-primary-800">
        <div class="bg-primary-50 dark:bg-primary-950 px-6 py-4 border-b border-primary-200 dark:border-primary-800">
          <h2 class="font-semibold text-primary-900 dark:text-primary-50">Current Subscription</h2>
        </div>
        <app-card-body class="space-y-6">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-muted mb-1">Plan</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{{ currentPlan }}</p>
              <p class="text-sm text-muted mt-2">Renews on June 1, 2024</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-muted mb-1">Monthly Cost</p>
              <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                \${{ currentPrice }}<span class="text-sm">/mo</span>
              </p>
              <button class="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 dark:text-primary-400">
                Change Plan
              </button>
            </div>
          </div>

          <!-- Usage Metrics -->
          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div>
              <p class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">API Calls Used</p>
              <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">1.2M / 5M</p>
              <div class="w-full bg-neutral-200 rounded-full h-2 mt-2 dark:bg-neutral-700">
                <div class="bg-primary-600 h-2 rounded-full" style="width: 24%"></div>
              </div>
            </div>
            <div>
              <p class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Storage Used</p>
              <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">12GB / 100GB</p>
              <div class="w-full bg-neutral-200 rounded-full h-2 mt-2 dark:bg-neutral-700">
                <div class="bg-primary-600 h-2 rounded-full" style="width: 12%"></div>
              </div>
            </div>
            <div>
              <p class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Team Members</p>
              <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">3 / 10</p>
              <div class="w-full bg-neutral-200 rounded-full h-2 mt-2 dark:bg-neutral-700">
                <div class="bg-primary-600 h-2 rounded-full" style="width: 30%"></div>
              </div>
            </div>
          </div>
        </app-card-body>
      </app-card>

      <!-- Payment Method -->
      <app-card>
        <div class="card-header flex items-center justify-between">
          <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Payment Method</h2>
          <button class="text-primary-600 hover:text-primary-700 text-sm font-medium dark:text-primary-400">
            Update
          </button>
        </div>
        <app-card-body class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-8 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center text-xs font-bold">
              VISA
            </div>
            <div>
              <p class="font-medium text-neutral-900 dark:text-neutral-50">Visa ending in 4242</p>
              <p class="text-sm text-muted">Expires 12/26</p>
            </div>
            <span class="badge-success ml-auto">Primary</span>
          </div>
        </app-card-body>
      </app-card>

      <!-- Plans -->
      <div>
        <h2 class="section-header mb-6">Available Plans</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div *ngFor="let plan of plans()" [ngClass]="plan.isCurrent ? 'ring-2 ring-primary-600' : ''" class="card rounded-xl overflow-hidden transition-all hover:shadow-lg">
            <div [ngClass]="plan.isCurrent ? 'bg-primary-600 text-white' : 'bg-neutral-50 dark:bg-neutral-800'" class="card-header">
              <h3 class="font-bold text-lg">{{ plan.name }}</h3>
              <p [ngClass]="plan.isCurrent ? 'text-primary-100' : 'text-muted'" class="text-sm mt-1">
                {{ plan.description }}
              </p>
            </div>
            <div class="card-body">
              <div class="text-3xl font-bold mb-2" [ngClass]="plan.isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-900 dark:text-neutral-50'">
                <span>\${{ plan.price }}</span>
              </div>
              <p [ngClass]="plan.isCurrent ? 'text-white dark:text-white' : 'text-muted'" class="text-sm mb-6">per month</p>

              <!-- Features -->
              <ul class="space-y-3 mb-6">
                <li *ngFor="let feature of plan.features" class="flex items-start gap-2 text-sm">
                  <svg class="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span [ngClass]="plan.isCurrent ? 'text-white dark:text-white' : 'text-neutral-700 dark:text-neutral-300'">
                    {{ feature }}
                  </span>
                </li>
              </ul>

              <!-- CTA Button -->
              <button [ngClass]="plan.isCurrent ? 'btn-ghost' : 'btn-primary'" class="w-full">
                {{ plan.ctaLabel }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoices -->
      <app-card>
        <div class="card-header flex items-center justify-between">
          <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Billing History</h2>
          <button class="text-primary-600 hover:text-primary-700 text-sm font-medium dark:text-primary-400">
            Download All
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th class="table-header">Invoice</th>
                <th class="table-header">Date</th>
                <th class="table-header">Amount</th>
                <th class="table-header">Status</th>
                <th class="table-header">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
              <tr *ngFor="let invoice of invoices()" class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <td class="table-cell font-medium">{{ invoice.description }}</td>
                <td class="table-cell">{{ invoice.date | date: 'MMM d, yyyy' }}</td>
                <td class="table-cell font-semibold">\${{ invoice.amount }}</td>
                <td class="table-cell">
                  <span [ngClass]="{
                    'badge-success': invoice.status === 'paid',
                    'badge-warning': invoice.status === 'pending',
                    'badge-danger': invoice.status === 'failed'
                  }" class="badge">
                    {{ invoice.status | uppercase }}
                  </span>
                </td>
                <td class="table-cell">
                  <a [href]="invoice.downloadUrl" class="text-primary-600 hover:text-primary-700 text-sm font-medium dark:text-primary-400">
                    Download
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>

      <!-- Billing Email -->
      <app-card>
        <div class="card-header">
          <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Billing Email</h2>
        </div>
        <app-card-body class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Email for receipts and notifications
            </label>
            <div class="flex gap-2">
              <input type="email" value="admin@example.com" class="input-field flex-1" />
              <button class="btn-secondary">Update</button>
            </div>
          </div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked class="w-4 h-4" />
            <span class="text-sm text-neutral-700 dark:text-neutral-300">
              Send billing notifications to this email
            </span>
          </label>
        </app-card-body>
      </app-card>
    </div>
  `,
})
export class BillingComponent {
  currentPlan = 'Pro';
  currentPrice = 99;

  plans = signal<Plan[]>([
    {
      name: 'Starter',
      price: 29,
      description: 'Perfect for small projects',
      features: [
        '1M API calls/month',
        '10GB storage',
        'Up to 5 team members',
        'Community support',
        'Basic analytics',
      ],
      isCurrent: false,
      ctaLabel: 'Downgrade',
    },
    {
      name: 'Pro',
      price: 99,
      description: 'Most popular for growing teams',
      features: [
        '5M API calls/month',
        '100GB storage',
        'Up to 20 team members',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
        'API access',
      ],
      isCurrent: true,
      ctaLabel: 'Current Plan',
    },
    {
      name: 'Enterprise',
      price: 499,
      description: 'For large-scale deployments',
      features: [
        'Unlimited API calls',
        'Unlimited storage',
        'Unlimited team members',
        '24/7 dedicated support',
        'Advanced analytics & reporting',
        'Custom contracts',
        'SLA guarantee',
        'Single sign-on (SSO)',
      ],
      isCurrent: false,
      ctaLabel: 'Upgrade',
    },
  ]);

  invoices = signal<Invoice[]>([
    {
      id: 'INV-2024-06',
      date: new Date('2024-06-01'),
      amount: 99,
      status: 'paid',
      description: 'Pro Plan - June 2024',
      downloadUrl: '#',
    },
    {
      id: 'INV-2024-05',
      date: new Date('2024-05-01'),
      amount: 99,
      status: 'paid',
      description: 'Pro Plan - May 2024',
      downloadUrl: '#',
    },
    {
      id: 'INV-2024-04',
      date: new Date('2024-04-01'),
      amount: 99,
      status: 'paid',
      description: 'Pro Plan - April 2024',
      downloadUrl: '#',
    },
    {
      id: 'INV-2024-03',
      date: new Date('2024-03-01'),
      amount: 99,
      status: 'paid',
      description: 'Pro Plan - March 2024',
      downloadUrl: '#',
    },
    {
      id: 'INV-2024-02',
      date: new Date('2024-02-01'),
      amount: 99,
      status: 'paid',
      description: 'Pro Plan - February 2024',
      downloadUrl: '#',
    },
    {
      id: 'INV-2024-01',
      date: new Date('2024-01-01'),
      amount: 99,
      status: 'paid',
      description: 'Pro Plan - January 2024',
      downloadUrl: '#',
    },
  ]);
}
