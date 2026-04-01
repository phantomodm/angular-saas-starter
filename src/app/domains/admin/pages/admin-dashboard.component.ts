import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, CardComponent, CardBodyComponent, CardHeaderComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="section-header">Admin Dashboard</h1>
        <p class="section-subheader mt-2">Manage users, roles, and system settings</p>
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
              @for (user of users(); track user) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <td class="table-cell font-medium">{{ user.displayName }}</td>
                  <td class="table-cell">{{ user.email }}</td>
                  <td class="table-cell">
                    <div class="flex gap-2 flex-wrap">
                      @for (role of user.roles; track role) {
                        <span class="badge-primary">
                          {{ role }}
                        </span>
                      }
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
              }
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
          @for (log of auditLogs(); track log) {
            <div class="card-body border-b dark:border-neutral-700 py-4">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-neutral-50">{{ log.action }}</p>
                  <p class="text-sm text-muted mt-1">by {{ log.user }}</p>
                </div>
                <span class="text-xs text-muted">{{ log.timestamp }}</span>
              </div>
            </div>
          }
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
