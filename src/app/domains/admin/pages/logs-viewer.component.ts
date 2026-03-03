import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoggingService } from '../../../core/services/logging.service';
import { LogEntry, LogSeverity, LogSource } from '../../../core/models/logging.model';
import { signal } from '@angular/core';
import { CardComponent, CardBodyComponent, CardHeaderComponent } from '../../../shared/ui/card.component';

@Component({
  selector: 'app-logs-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">Logs Viewer</h1>
          <p class="text-neutral-600 dark:text-neutral-400 mt-1">
            Monitor application errors and activities in real-time
          </p>
        </div>
        <div class="flex gap-2">
          <button
            (click)="exportLogs()"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Export Logs
          </button>
          <button
            (click)="clearLogs()"
            class="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div class="text-sm text-neutral-600 dark:text-neutral-400">Total Logs</div>
          <div class="text-2xl font-bold text-neutral-900 dark:text-white">{{ stats().totalLogs }}</div>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div class="text-sm text-neutral-600 dark:text-neutral-400">Last 24h</div>
          <div class="text-2xl font-bold text-neutral-900 dark:text-white">{{ stats().logsBy24h }}</div>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div class="text-sm text-danger-600 dark:text-danger-400">Errors</div>
          <div class="text-2xl font-bold text-danger-600">{{ stats().errorCount }}</div>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div class="text-sm text-warning-600 dark:text-warning-400">Warnings</div>
          <div class="text-2xl font-bold text-warning-600">{{ stats().warningCount }}</div>
        </div>
        <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div class="text-sm text-primary-600 dark:text-primary-400">Critical</div>
          <div class="text-2xl font-bold text-primary-600">{{ stats().criticalCount }}</div>
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
                Severity
              </label>
              <select
                [(ngModel)]="selectedSeverity"
                class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                  bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Severities</option>
                <option value="DEBUG">Debug</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Source
              </label>
              <select
                [(ngModel)]="selectedSource"
                class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                  bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Sources</option>
                <option value="HTTP">HTTP</option>
                <option value="AUTH">Auth</option>
                <option value="PROFILE">Profile</option>
                <option value="APP">App</option>
                <option value="ERROR">Error</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                &nbsp;
              </label>
              <button
                (click)="applyFilters()"
                class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700
                  transition font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </app-card-body>
      </app-card>

      <!-- Top Errors -->
      @if (stats().topErrors.length > 0) {
        <app-card>
          <app-card-header title="Top Errors (Last 24h)"></app-card-header>
          <app-card-body>
            <div class="space-y-2">
              @for (error of stats().topErrors; track error.error) {
                <div class="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <span class="text-sm text-neutral-700 dark:text-neutral-300 truncate">{{ error.error }}</span>
                  <span
                    class="px-3 py-1 bg-danger-100 dark:bg-danger-900 text-danger-700 dark:text-danger-300
                    rounded-full text-sm font-medium"
                  >
                    {{ error.count }}
                  </span>
                </div>
              }
            </div>
          </app-card-body>
        </app-card>
      }

      <!-- Logs Table -->
      <app-card>
        <app-card-header title="Logs"></app-card-header>
        <app-card-body>
          @if (filteredLogs().length === 0) {
            <div class="text-center py-12">
              <p class="text-neutral-600 dark:text-neutral-400">No logs found</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-neutral-50 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Time
                    </th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Severity
                    </th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Source
                    </th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Message
                    </th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                  @for (log of filteredLogs().slice(0, 50); track log.requestId) {
                    <tr
                      class="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition cursor-pointer"
                      (click)="toggleLogDetail(log.requestId)"
                    >
                      <td class="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                        {{ formatTime(log.timestamp) }}
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <span [class]="getSeverityClass(log.severity)">
                          {{ log.severity }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-neutral-900 dark:text-white font-medium">
                        {{ log.source }}
                      </td>
                      <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 truncate max-w-xs">
                        {{ log.message }}
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <button
                          (click)="toggleLogDetail(log.requestId); $event.stopPropagation()"
                          class="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                    @if (expandedLogId() === log.requestId) {
                      <tr class="bg-neutral-50 dark:bg-neutral-700">
                        <td colspan="5" class="px-4 py-4">
                          <div class="space-y-3">
                            @if (log.userId) {
                              <div>
                                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  User:
                                </span>
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                                  {{ log.userId }} ({{ log.userEmail }})
                                </span>
                              </div>
                            }
                            @if (log.metadata) {
                              <div>
                                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  Metadata:
                                </span>
                                <pre class="text-xs bg-neutral-900 text-neutral-50 p-2 rounded mt-1 overflow-auto">{{
                                  formatJson(log.metadata)
                                }}</pre>
                              </div>
                            }
                            @if (log.stackTrace) {
                              <div>
                                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  Stack Trace:
                                </span>
                                <pre class="text-xs bg-neutral-900 text-neutral-50 p-2 rounded mt-1 overflow-auto">{{
                                  log.stackTrace
                                }}</pre>
                              </div>
                            }
                            @if (log.tags && log.tags.length > 0) {
                              <div>
                                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
                                  Tags:
                                </span>
                                <div class="flex flex-wrap gap-2">
                                  @for (tag of log.tags; track tag) {
                                    <span
                                      class="px-2 py-1 bg-primary-100 dark:bg-primary-900
                                      text-primary-700 dark:text-primary-300 rounded text-xs font-medium"
                                    >
                                      {{ tag }}
                                    </span>
                                  }
                                </div>
                              </div>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            @if (filteredLogs().length > 50) {
              <div class="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
                Showing 50 of {{ filteredLogs().length }} logs
              </div>
            }
          }
        </app-card-body>
      </app-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class LogsViewerComponent implements OnInit {
  private loggingService = inject(LoggingService);

  // Filters
  searchQuery = signal('');
  selectedSeverity = signal('');
  selectedSource = signal('');
  expandedLogId = signal<string | null>(null);

  // Data
  allLogs = this.loggingService.getLogs();
  filteredLogs = signal<LogEntry[]>([]);
  stats = this.loggingService.logsStats;

  ngOnInit(): void {
    this.applyFilters();
  }

  /**
   * Apply filters to logs
   */
  applyFilters(): void {
    const logs = this.loggingService.filterLogs({
      severity: this.selectedSeverity() as LogSeverity | undefined,
      source: this.selectedSource() as LogSource | undefined,
      search: this.searchQuery() || undefined,
    });

    this.filteredLogs.set(logs);
  }

  /**
   * Toggle log detail expansion
   */
  toggleLogDetail(requestId: string | undefined): void {
    if (!requestId) return;

    this.expandedLogId.set(this.expandedLogId() === requestId ? null : requestId);
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): void {
    const json = this.loggingService.exportLogs(this.filteredLogs());

    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      this.loggingService.clearLogs();
      this.filteredLogs.set([]);
    }
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  }

  /**
   * Format JSON for display
   */
  formatJson(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  /**
   * Get severity CSS class
   */
  getSeverityClass(severity: LogSeverity): string {
    const classes = {
      DEBUG: 'px-2 py-1 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded text-xs font-medium',
      INFO: 'px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium',
      WARNING:
        'px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium',
      ERROR: 'px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-medium',
      CRITICAL:
        'px-2 py-1 bg-red-200 dark:bg-red-950 text-red-800 dark:text-red-200 rounded text-xs font-medium font-bold',
    };

    return classes[severity] || classes.INFO;
  }
}