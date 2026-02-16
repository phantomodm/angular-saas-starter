import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, CardBodyComponent, CardHeaderComponent, KpiCardComponent } from '../../../shared/ui/card.component';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
    tension?: number;
  }>;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, CardComponent, CardBodyComponent, CardHeaderComponent, KpiCardComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="section-header">Analytics & Insights</h1>
          <p class="section-subheader mt-2">View detailed metrics and performance analytics</p>
        </div>
        <select class="input-field w-48">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>Last year</option>
        </select>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <app-kpi-card
          label="Total API Calls"
          value="12.5M"
          [change]="23"
        ></app-kpi-card>

        <app-kpi-card
          label="Average Response Time"
          value="145ms"
          [change]="-8"
        ></app-kpi-card>

        <app-kpi-card
          label="Error Rate"
          value="0.23%"
          [change]="-5"
        ></app-kpi-card>

        <app-kpi-card
          label="Active Users"
          value="3,245"
          [change]="15"
        ></app-kpi-card>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- API Calls Over Time -->
        <app-card>
          <app-card-header>
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">API Calls (Last 30 days)</h2>
          </app-card-header>
          <app-card-body>
            <div class="h-64 flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg">
              <div class="text-center">
                <p class="text-neutral-500 dark:text-neutral-400 mb-2">Chart.js Integration</p>
                <p class="text-sm text-neutral-400">
                  Line chart showing API calls trend
                </p>
                <div class="mt-4 space-y-2 text-left inline-block">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-primary-600 rounded-full"></div>
                    <span class="text-xs text-neutral-600 dark:text-neutral-400">API Calls: 12.5M average</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-primary-400 rounded-full"></div>
                    <span class="text-xs text-neutral-600 dark:text-neutral-400">Peak: 18.3M on Day 15</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4 mt-6">
              <div class="text-center">
                <p class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Avg Daily</p>
                <p class="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-1">418K</p>
              </div>
              <div class="text-center">
                <p class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Peak Daily</p>
                <p class="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-1">892K</p>
              </div>
              <div class="text-center">
                <p class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Total</p>
                <p class="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-1">12.5M</p>
              </div>
            </div>
          </app-card-body>
        </app-card>

        <!-- Response Time Distribution -->
        <app-card>
          <app-card-header>
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Response Time Distribution</h2>
          </app-card-header>
          <app-card-body>
            <div class="h-64 flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg">
              <div class="text-center">
                <p class="text-neutral-500 dark:text-neutral-400 mb-2">Chart.js Integration</p>
                <p class="text-sm text-neutral-400">
                  Bar chart showing response time distribution
                </p>
                <div class="mt-4 space-y-2 text-left inline-block">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-success-600 rounded-full"></div>
                    <span class="text-xs text-neutral-600 dark:text-neutral-400">&lt;100ms: 45%</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-warning-600 rounded-full"></div>
                    <span class="text-xs text-neutral-600 dark:text-neutral-400">100-300ms: 40%</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-danger-600 rounded-full"></div>
                    <span class="text-xs text-neutral-600 dark:text-neutral-400">&gt;300ms: 15%</span>
                  </div>
                </div>
              </div>
            </div>
          </app-card-body>
        </app-card>

        <!-- Requests by Endpoint -->
        <app-card>
          <app-card-header>
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Top API Endpoints</h2>
          </app-card-header>
          <app-card-body>
            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">/api/users</span>
                  <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">3.2M</span>
                </div>
                <div class="w-full bg-neutral-200 rounded-full h-2 dark:bg-neutral-700">
                  <div class="bg-primary-600 h-2 rounded-full" style="width: 100%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">/api/projects</span>
                  <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">2.8M</span>
                </div>
                <div class="w-full bg-neutral-200 rounded-full h-2 dark:bg-neutral-700">
                  <div class="bg-primary-600 h-2 rounded-full" style="width: 87%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">/api/analytics</span>
                  <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">2.1M</span>
                </div>
                <div class="w-full bg-neutral-200 rounded-full h-2 dark:bg-neutral-700">
                  <div class="bg-primary-600 h-2 rounded-full" style="width: 65%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">/api/settings</span>
                  <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">1.9M</span>
                </div>
                <div class="w-full bg-neutral-200 rounded-full h-2 dark:bg-neutral-700">
                  <div class="bg-primary-600 h-2 rounded-full" style="width: 59%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">/api/webhooks</span>
                  <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">1.5M</span>
                </div>
                <div class="w-full bg-neutral-200 rounded-full h-2 dark:bg-neutral-700">
                  <div class="bg-primary-600 h-2 rounded-full" style="width: 47%"></div>
                </div>
              </div>
            </div>
          </app-card-body>
        </app-card>

        <!-- Error Breakdown -->
        <app-card>
          <app-card-header>
            <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Error Distribution</h2>
          </app-card-header>
          <app-card-body>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-success-600 rounded-full"></div>
                  <span class="text-sm text-neutral-700 dark:text-neutral-300">2xx Success</span>
                </div>
                <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">99.5%</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-warning-600 rounded-full"></div>
                  <span class="text-sm text-neutral-700 dark:text-neutral-300">3xx Redirect</span>
                </div>
                <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">0.2%</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-danger-600 rounded-full"></div>
                  <span class="text-sm text-neutral-700 dark:text-neutral-300">4xx Client Error</span>
                </div>
                <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">0.2%</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-danger-700 rounded-full"></div>
                  <span class="text-sm text-neutral-700 dark:text-neutral-300">5xx Server Error</span>
                </div>
                <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">0.1%</span>
              </div>
            </div>
            <div class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <p class="text-xs text-muted mb-3">Error Rate Trend</p>
              <div class="flex items-end gap-1 h-12">
                <div class="flex-1 bg-success-200 dark:bg-success-900 rounded" style="height: 40%"></div>
                <div class="flex-1 bg-success-200 dark:bg-success-900 rounded" style="height: 30%"></div>
                <div class="flex-1 bg-success-200 dark:bg-success-900 rounded" style="height: 50%"></div>
                <div class="flex-1 bg-success-200 dark:bg-success-900 rounded" style="height: 25%"></div>
                <div class="flex-1 bg-success-200 dark:bg-success-900 rounded" style="height: 35%"></div>
                <div class="flex-1 bg-success-200 dark:bg-success-900 rounded" style="height: 20%"></div>
                <div class="flex-1 bg-warning-200 dark:bg-warning-900 rounded" style="height: 45%"></div>
              </div>
            </div>
          </app-card-body>
        </app-card>
      </div>

      <!-- Requests By Country -->
      <app-card>
        <app-card-header>
          <h2 class="font-semibold text-neutral-900 dark:text-neutral-50">Traffic by Region</h2>
        </app-card-header>
        <app-card-body>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center">
              <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">28%</p>
              <p class="text-sm text-muted mt-2">United States</p>
              <p class="text-xs text-muted mt-1">3.5M requests</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">22%</p>
              <p class="text-sm text-muted mt-2">Europe</p>
              <p class="text-xs text-muted mt-1">2.75M requests</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">18%</p>
              <p class="text-sm text-muted mt-2">Asia Pacific</p>
              <p class="text-xs text-muted mt-1">2.25M requests</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">32%</p>
              <p class="text-sm text-muted mt-2">Other</p>
              <p class="text-xs text-muted mt-1">4M requests</p>
            </div>
          </div>
        </app-card-body>
      </app-card>
    </div>
  `,
})
export class AnalyticsComponent {
  // Chart data would go here if using Chart.js
  // For now, we're displaying static visualizations
}
