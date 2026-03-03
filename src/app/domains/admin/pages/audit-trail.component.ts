import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog } from '../../../core/models/organization.model';
import { signal } from '@angular/core';
import { CardComponent, CardBodyComponent, CardHeaderComponent } from '../../../shared/ui/card.component';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, CardBodyComponent, CardHeaderComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">Audit Trail</h1>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          View all actions and changes in your organization
        </p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">Total Logs</p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-white">{{ stats().totalLogs }}</p>
        </div>
        <div class="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">Last 7 Days</p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-white">{{ stats().recentLogs }}</p>
        </div>
        <div class="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <p class="text-sm text-success-600 dark:text-success-400">Successful</p>
          <p class="text-2xl font-bold text-success-600">{{ stats().successCount }}</p>
        </div>
        <div class="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <p class="text-sm text-danger-600 dark:text-danger-400">Failed</p>
          <p class="text-2xl font-bold text-danger-600">{{ stats().failureCount }}</p>
        </div>
      </div>

      <!-- Filters -->
      <app-card>
        <app-card-header title="Filters"></app-card-header>
        <app-card-body>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Search
              </label>
              <input
                [(ngModel)]="searchQuery"
                type="text"
                placeholder="Search logs..."
                class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                  bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Action
              </label>
              <select
                [(ngModel)]="filterAction"
                class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                  bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Status
              </label>
              <select
                [(ngModel)]="filterStatus"
                class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                  bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select>
            </div>
            <div class="flex items-end gap-2">
              <button
                (click)="applyFilters()"
                class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700
                  transition font-medium"
              >
                Filter
              </button>
              <button
                (click)="exportLogs()"
                class="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white
                  rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
              >
                ⬇️
              </button>
            </div>
          </div>
        </app-card-body>
      </app-card>

      <!-- Audit Logs Table -->
      <app-card>
        <app-card-header title="Audit Logs"></app-card-header>
        @if (filteredLogs().length === 0) {
          <app-card-body>
            <p class="text-center text-neutral-600 dark:text-neutral-400 py-8">No audit logs found</p>
          </app-card-body>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Timestamp
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    User
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Action
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Resource
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                @for (log of filteredLogs().slice(0, 50); track log.id) {
                  <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                    <td class="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {{ log.createdAt | date: 'short' }}
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <div>
                        <p class="font-medium text-neutral-900 dark:text-white">{{ log.userEmail }}</p>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ log.userId }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs font-medium">
                        {{ log.action }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <div>
                        <p class="font-medium text-neutral-900 dark:text-white">{{ log.resourceType }}</p>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ log.resourceName }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        [class]="{
                          'bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300': log.status === 'success',
                          'bg-danger-100 dark:bg-danger-900 text-danger-700 dark:text-danger-300': log.status === 'failure',
                        }"
                        class="px-2 py-1 rounded text-xs font-medium"
                      >
                        {{ log.status }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (filteredLogs().length > 50) {
            <div class="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400">
              Showing 50 of {{ filteredLogs().length }} logs
            </div>
          }
        }
      </app-card>
    </div>
  `,
})
export class AuditTrailComponent implements OnInit {
  private auditService = inject(AuditService);

  allLogs = signal<AuditLog[]>([]);
  filteredLogs = signal<AuditLog[]>([]);
  stats = signal({
    totalLogs: 0,
    recentLogs: 0,
    successCount: 0,
    failureCount: 0,
    actionCounts: {},
    userCounts: {},
    resourceCounts: {},
  });

  searchQuery = '';
  filterAction = '';
  filterStatus = '';

  ngOnInit() {
    this.loadAuditLogs();
    this.loadStats();
  }

  loadAuditLogs() {
    this.auditService.getAuditLogs('org_1', { limit: 500 }).subscribe({
      next: (response) => {
        this.allLogs.set(response.data);
        this.filteredLogs.set(response.data);
      },
    });
  }

  loadStats() {
    this.auditService.getAuditStats('org_1').subscribe({
      next: (stats) => this.stats.set(stats),
    });
  }

  applyFilters() {
    let filtered = this.allLogs();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.userEmail.toLowerCase().includes(query) ||
          log.resourceName.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query),
      );
    }

    if (this.filterAction) {
      filtered = filtered.filter((log) => log.action === this.filterAction);
    }

    if (this.filterStatus) {
      filtered = filtered.filter((log) => log.status === this.filterStatus);
    }

    this.filteredLogs.set(filtered);
  }

  exportLogs() {
    this.auditService.exportAuditLogs('org_1').subscribe({
      next: (data) => {
        const blob = new Blob([data.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
    });
  }
}