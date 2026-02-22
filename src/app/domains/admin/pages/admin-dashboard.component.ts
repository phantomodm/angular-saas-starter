import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent, CardBodyComponent, CardHeaderComponent } from '../../../shared/ui/card.component';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, CardBodyComponent, CardHeaderComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="section-header">Admin Dashboard</h1>
        <p class="section-subheader mt-2">Manage users, roles, and system settings</p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <a
          routerLink="/admin/logs"
          class="p-4 bg-primary-50 dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg
            hover:bg-primary-100 dark:hover:bg-primary-800 transition cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 class="font-semibold text-primary-900 dark:text-primary-50">View Logs</h3>
              <p class="text-sm text-primary-700 dark:text-primary-300">Monitor errors & activity</p>
            </div>
          </div>
        </a>

        <a
          href="#"
          class="p-4 bg-success-50 dark:bg-success-900 border border-success-200 dark:border-success-700 rounded-lg
            hover:bg-success-100 dark:hover:bg-success-800 transition cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div>
              <h3 class="font-semibold text-success-900 dark:text-success-50">Analytics</h3>
              <p class="text-sm text-success-700 dark:text-success-300">View system metrics</p>
            </div>
          </div>
        </a>

        <a
          href="#"
          class="p-4 bg-warning-50 dark:bg-warning-900 border border-warning-200 dark:border-warning-700 rounded-lg
            hover:bg-warning-100 dark:hover:bg-warning-800 transition cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 0v2m0-6h4m-6 0h4m0-6H8m6 0H8m0 0h4m0 0h-4m0-2h4m0 2h-4" />
            </svg>
            <div>
              <h3 class="font-semibold text-warning-900 dark:text-warning-50">Settings</h3>
              <p class="text-sm text-warning-700 dark:text-warning-300">System configuration</p>
            </div>
          </div>
        </a>

        <a
          href="#"
          class="p-4 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg
            hover:bg-neutral-100 dark:hover:bg-neutral-600 transition cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-50">Support</h3>
              <p class="text-sm text-neutral-700 dark:text-neutral-300">Get help & resources</p>
            </div>
          </div>
        </a>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <app-card>
          <app-card-body>
            <p class="text-muted text-sm mb-2">Total Users</p>
            <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">12,543</p>
          </app-card-body>
        </app-card>
        <app-card>
          <app-card-body>
            <p class="text-muted text-sm mb-2">Active Tenants</p>
            <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">487</p>
          </app-card-body>
        </app-card>
        <app-card>
          <app-card-body>
            <p class="text-muted text-sm mb-2">System Health</p>
            <p class="text-3xl font-bold text-success-600 dark:text-success-400">99.9%</p>
          </app-card-body>
        </app-card>
      </div>

      <!-- User Management -->
      <app-card>
        <app-card-header class="flex items-center justify-between">
          <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">User Management</h2>
          <button class="btn-primary text-sm">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </app-card-header>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th class="table-header">User</th>
                <th class="table-header">Email</th>
                <th class="table-header">Roles</th>
                <th class="table-header">Status</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
              <tr *ngFor="let user of users()" class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <td class="table-cell font-medium">{{ user.displayName }}</td>
                <td class="table-cell">{{ user.email }}</td>
                <td class="table-cell">
                  <div class="flex gap-2 flex-wrap">
                    <span *ngFor="let role of user.roles" class="badge-primary">
                      {{ role }}
                    </span>
                  </div>
                </td>
                <td class="table-cell">
                  <span [ngClass]="user.status === 'active' ? 'badge-success' : 'badge-danger'" class="badge">
                    {{ user.status }}
                  </span>
                </td>
                <td class="table-cell">
                  <button class="text-primary-600 hover:text-primary-700 text-sm font-medium dark:text-primary-400">
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>

      <!-- Audit Logs -->
      <app-card>
        <app-card-header>
          <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Recent Audit Logs</h2>
        </app-card-header>
        <div class="divide-y divide-neutral-200 dark:divide-neutral-700">
          <div *ngFor="let log of auditLogs()" class="card-body border-b dark:border-neutral-700 py-4">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-medium text-neutral-900 dark:text-neutral-50">{{ log.action }}</p>
                <p class="text-sm text-muted mt-1">by {{ log.user }}</p>
              </div>
              <span class="text-xs text-muted">{{ log.timestamp }}</span>
            </div>
          </div>
        </div>
      </app-card>
    </div>
  `,
})
export class AdminDashboardComponent {
  users = signal<AdminUser[]>([
    {
      id: '1',
      email: 'admin@example.com',
      displayName: 'Admin User',
      roles: ['admin'],
      status: 'active',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      email: 'user@example.com',
      displayName: 'Regular User',
      roles: ['user'],
      status: 'active',
      createdAt: new Date('2024-02-15'),
    },
    {
      id: '3',
      email: 'developer@example.com',
      displayName: 'Developer User',
      roles: ['developer', 'user'],
      status: 'active',
      createdAt: new Date('2024-03-10'),
    },
  ]);

  auditLogs = signal([
    {
      action: 'User login',
      user: 'admin@example.com',
      timestamp: 'Today at 2:30 PM',
    },
    {
      action: 'API key created',
      user: 'user@example.com',
      timestamp: 'Today at 1:15 PM',
    },
    {
      action: 'User role updated',
      user: 'admin@example.com',
      timestamp: 'Yesterday at 9:45 AM',
    },
    {
      action: 'System configuration changed',
      user: 'admin@example.com',
      timestamp: '2 days ago',
    },
  ]);
}
