import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { KpiCardComponent } from '../../../shared/ui/card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HasRoleDirective,
    HasPermissionDirective,
    KpiCardComponent,
  ],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="section-header">Welcome back, {{ authStore.userName() }}</h1>
        <p class="section-subheader mt-2">Here's what's happening with your workspace today</p>
      </div>

      <!-- KPI Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <app-kpi-card
          label="Total Users"
          value="12,543"
          [change]="12"
        ></app-kpi-card>

        <app-kpi-card
          label="Active Projects"
          value="47"
          [change]="8"
        ></app-kpi-card>

        <app-kpi-card
          label="Monthly Revenue"
          value="$45,231"
          [change]="23"
        ></app-kpi-card>

        <app-kpi-card
          label="API Calls (24h)"
          value="1.2M"
          [change]="-5"
        ></app-kpi-card>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Admin Section -->
        <div *hasRole="'admin'" class="card">
          <div class="card-header">
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Admin Panel</h2>
          </div>
          <div class="card-body space-y-4">
            <p class="text-sm text-muted">Manage users, roles, and system settings</p>
            <a
              routerLink="/admin"
              class="btn-primary inline-block w-full text-center"
            >
              Go to Admin Dashboard
            </a>
          </div>
        </div>

        <!-- Developer Section -->
        <div *hasPermission="'developer.manage'" class="card">
          <div class="card-header">
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Developer Tools</h2>
          </div>
          <div class="card-body space-y-4">
            <p class="text-sm text-muted">API keys, webhooks, and integration settings</p>
            <a
              routerLink="/developer"
              class="btn-primary inline-block w-full text-center"
            >
              Access Developer Settings
            </a>
          </div>
        </div>

        <!-- Analytics -->
        <div class="card">
          <div class="card-header">
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Analytics</h2>
          </div>
          <div class="card-body space-y-4">
            <p class="text-sm text-muted">Detailed insights into your usage and performance</p>
            <a
              routerLink="/analytics"
              class="btn-primary inline-block w-full text-center"
            >
              View Analytics
            </a>
          </div>
        </div>

        <!-- Billing -->
        <div class="card">
          <div class="card-header">
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Billing</h2>
          </div>
          <div class="card-body space-y-4">
            <p class="text-sm text-muted">Current plan: <strong>Pro</strong></p>
            <p class="text-xs text-muted">Next billing date: June 1, 2024</p>
            <a
              routerLink="/billing"
              class="btn-secondary inline-block w-full text-center"
            >
              Manage Subscription
            </a>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header">
          <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Recent Activity</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th class="table-header">Event</th>
                <th class="table-header">Date</th>
                <th class="table-header">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <td class="table-cell font-medium">API Key Created</td>
                <td class="table-cell">Today at 2:30 PM</td>
                <td class="table-cell">
                  <span class="badge-success">Success</span>
                </td>
              </tr>
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <td class="table-cell font-medium">Project Updated</td>
                <td class="table-cell">Today at 1:15 PM</td>
                <td class="table-cell">
                  <span class="badge-primary">Completed</span>
                </td>
              </tr>
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <td class="table-cell font-medium">User Invited</td>
                <td class="table-cell">Yesterday at 9:45 AM</td>
                <td class="table-cell">
                  <span class="badge-warning">Pending</span>
                </td>
              </tr>
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <td class="table-cell font-medium">Billing Updated</td>
                <td class="table-cell">2 days ago</td>
                <td class="table-cell">
                  <span class="badge-success">Success</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  authStore = inject(AuthStore);
}
