import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import {
  IngestionService,
  ContinuityIndex,
} from '../../core/services/new/ingestion';
import {
  ContinuityCoreService,
  ResilienceMetric,
} from '../../core/services/new/continuity-core';
import { EcosystemStore } from '../../core/store/ecosystem.store';
import { AlertService } from '../../core/services/new/alert';
import {
  EcosystemInstance,
  EcosystemLibraryService,
} from '../ecosystems/ecosystem-library';
import { EcosystemEngineService } from '../ecosystems/ecosystem-engine';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
  ],
  template: `
    <div class="p-4 md:p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-6 md:mb-8">
          <h1 class="text-3xl font-bold">Continuity Dashboard</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Real-time monitoring of financial ecosystem resilience
          </p>
        </div>

        <!-- Ecosystem Selector Card -->
        <mat-card class="mb-6 md:mb-8">
          <mat-card-header>
            <mat-card-title>Ecosystem Context</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <mat-form-field class="w-full">
                <mat-label>Current Ecosystem</mat-label>
                <mat-select
                  (change)="onEcosystemChange($event)"
                  [value]="selectedEcosystem()?.id || ''"
                >
                  @for (ecosystem of ecosystems(); track ecosystem.id) {
                    <mat-option [value]="ecosystem.id">
                      {{ ecosystem.name }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (selectedEcosystem()) {
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400"
                    >Status:</span
                  >
                  <mat-chip
                    [ngClass]="getStatusChipClass(selectedEcosystem()!.status)"
                  >
                    {{ selectedEcosystem()!.status | uppercase }}
                  </mat-chip>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400"
                    >Entities:</span
                  >
                  <span class="font-bold">{{
                    selectedEcosystem()!.monitoredEntities
                  }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Continuity Index & Resilience -->
        <div
          class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8"
        >
          <!-- Continuity Index Card -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Continuity Index</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="flex items-center justify-between mb-6">
                <div>
                  <div
                    [ngClass]="'text-' + getIndexColorClass()"
                    class="text-5xl font-bold"
                  >
                    {{ index().score }}
                  </div>
                  <p [ngClass]="'text-' + getIndexColorClass() + ' mt-2'">
                    {{ getStatusLabel(index().status) }}
                  </p>
                </div>
                <div class="w-28 h-28 flex items-center justify-center">
                  <svg viewBox="0 0 120 120" class="w-full h-full">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="text-gray-300 dark:text-gray-700"
                    />
                    <path
                      d="M60 10 A50 50 0 0 1 109.24 29.39"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="4"
                      class="text-red-500"
                    />
                    <path
                      d="M109.24 29.39 A50 50 0 0 1 98.48 87.94"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="4"
                      class="text-amber-500"
                    />
                    <path
                      d="M98.48 87.94 A50 50 0 0 1 60 110"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="4"
                      class="text-green-500"
                    />
                    <line
                      [attr.x1]="60"
                      [attr.y1]="60"
                      [attr.x2]="60 + 40 * Math.cos(getNeedleAngle())"
                      [attr.y2]="60 + 40 * Math.sin(getNeedleAngle())"
                      stroke="white"
                      stroke-width="3"
                      stroke-linecap="round"
                    />
                    <circle cx="60" cy="60" r="4" fill="white" />
                  </svg>
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Last Updated: {{ index().lastUpdated | date: 'short' }}
              </p>
            </mat-card-content>
          </mat-card>

          <!-- Resilience Metric Card -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Resilience Metric</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="space-y-6">
                <!-- Resilience Score -->
                <div>
                  <div class="flex justify-between mb-2">
                    <span class="text-sm font-medium">Resilience Score</span>
                    <span class="font-bold"
                      >{{ resilience().resilience | number: '1.0-1' }}/100</span
                    >
                  </div>
                  <mat-progress-bar
                    mode="determinate"
                    [value]="resilience().resilience"
                    [ngClass]="'resilience-bar-' + getResilienceLevel()"
                  ></mat-progress-bar>
                </div>

                <!-- Confidence Level -->
                <div>
                  <div class="flex justify-between mb-2">
                    <span class="text-sm font-medium">Confidence Level</span>
                    <span class="font-bold"
                      >{{
                        resilience().confidence * 100 | number: '1.0-1'
                      }}%</span
                    >
                  </div>
                  <mat-progress-bar
                    mode="determinate"
                    [value]="resilience().confidence * 100"
                    color="accent"
                  ></mat-progress-bar>
                </div>

                <!-- Snap Probability -->
                <div>
                  <div class="flex justify-between mb-2">
                    <span class="text-sm font-medium">Snap Probability</span>
                    <span
                      [ngClass]="getSnapProbabilityColor()"
                      class="font-bold"
                    >
                      {{ snapProbability() * 100 | number: '1.0-1' }}%
                    </span>
                  </div>
                  <mat-progress-bar
                    mode="determinate"
                    [value]="snapProbability() * 100"
                    [ngClass]="getSnapProbabilityColor()"
                  ></mat-progress-bar>
                </div>

                <mat-divider></mat-divider>

                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Forecast Horizon:
                    {{ resilience().timeHorizon | number: '1.0' }} hours
                  </p>
                  <p class="text-sm mt-2" [ngClass]="getTrendColor()">
                    Trend:
                    <span class="font-bold">{{
                      index().forecastedTrend | uppercase
                    }}</span>
                  </p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Predictive Timeline -->
        <mat-card class="mb-6 md:mb-8">
          <mat-card-header>
            <mat-card-title>3-14 Day Predictive Timeline</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-4 overflow-x-auto">
              @for (point of forecast; let i = $index; track i) {
                <div class="flex items-center gap-4">
                  <div
                    class="w-20 flex-shrink-0 text-xs text-gray-600 dark:text-gray-400"
                  >
                    {{ point.timestamp | date: 'MMM d' }}
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1 text-xs">
                      <span>Predicted</span>
                      <span class="font-medium">{{
                        point.resilience | number: '1.0-1'
                      }}</span>
                    </div>
                    <mat-progress-bar
                      mode="determinate"
                      [value]="point.resilience"
                      [ngClass]="getResilienceBarColor(point.resilience)"
                    ></mat-progress-bar>
                  </div>
                  <div
                    class="w-8 text-right flex-shrink-0 text-lg font-bold"
                    [ngClass]="getResilienceStatusColor(point.resilience)"
                  >
                    {{
                      point.resilience > 75
                        ? '✓'
                        : point.resilience > 50
                          ? '⚠'
                          : '✗'
                    }}
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Alerts & Market Data -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <!-- Recent Alerts -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Recent Alerts</mat-card-title>
            </mat-card-header>
            <mat-card-content class="max-h-96 overflow-y-auto">
              @if (recentAlerts().length > 0) {
                <mat-list>
                  @for (alert of recentAlerts().slice(0, 5); track alert.id) {
                    <mat-list-item
                      class="mb-3 p-3 rounded-lg"
                      [ngClass]="getAlertBgClass(alert.level)"
                    >
                      <mat-icon
                        matListItemIcon
                        [ngClass]="getAlertIconColor(alert.level)"
                      >
                        {{ getAlertIcon(alert.level) }}
                      </mat-icon>
                      <div matListItemTitle class="text-sm font-medium">
                        {{ alert.title }}
                      </div>
                      <div
                        matListItemLine
                        class="text-xs text-gray-600 dark:text-gray-400"
                      >
                        {{ alert.message }}
                      </div>
                      <div matListItemMeta class="text-xs">
                        {{ alert.timestamp | date: 'short' }}
                      </div>
                    </mat-list-item>
                  }
                </mat-list>
              } @else {
                <p class="text-center text-gray-600 dark:text-gray-400 py-8">
                  No alerts
                </p>
              }
            </mat-card-content>
          </mat-card>

          <!-- Market Data Summary -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Market Data Summary</mat-card-title>
            </mat-card-header>
            <mat-card-content class="max-h-96 overflow-y-auto">
              <mat-list>
                @for (data of marketData(); track data.ticker) {
                  <mat-list-item class="mb-3">
                    <div class="w-full">
                      <div class="flex justify-between items-center mb-2">
                        <span class="font-bold">{{ data.ticker }}</span>
                        <span class="text-sm">{{
                          data.price | number: '1.0-2'
                        }}</span>
                      </div>
                      <div
                        class="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <div>Spread: {{ data.spread | number: '1.0-2' }}</div>
                        <div>
                          Rate: {{ data.interestRate | number: '1.0-2' }}%
                        </div>
                        <div>Vol: {{ data.volatility | number: '1.0-1' }}%</div>
                      </div>
                    </div>
                  </mat-list-item>
                }
              </mat-list>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .resilience-bar-healthy .mdc-linear-progress__bar {
        background-color: #4caf50;
      }

      ::ng-deep .resilience-bar-moderate .mdc-linear-progress__bar {
        background-color: #ff9800;
      }

      ::ng-deep .resilience-bar-low .mdc-linear-progress__bar {
        background-color: #f44336;
      }

      mat-card {
        background-color: var(--surface-container);
        border-radius: 12px;
      }

      ::ng-deep .mat-mdc-form-field {
        width: 100%;
      }
    `,
  ],
})
export class DashboardMaterial implements OnInit {
  private ingestionService = inject(IngestionService);
  private coreService = inject(ContinuityCoreService);
  private alertService = inject(AlertService);
  private ecosystemService = inject(EcosystemLibraryService);
  ecosystemStore = inject(EcosystemStore);

  Math = Math;

  index = computed(() => this.ingestionService.continuityIndexSignal());
  resilience = computed(() => this.coreService.getResilienceMetric());
  snapProbability = computed(() => this.coreService.getSnapProbability());
  selectedEcosystem = computed(() =>
    this.ecosystemService.selectedEcosystemSignal(),
  );
  recentAlerts = computed(() =>
    this.alertService.allAlertsSignal().slice(0, 5),
  );

  forecast: { timestamp: Date; resilience: number }[] = [];
  marketData: () => any[] = () => [];
  ecosystems: () => EcosystemInstance[] = () => [];

  constructor() {
    this.forecast = this.coreService.generateForecast(12);
  }

  ngOnInit(): void {
    this.ecosystemService.getInstances().subscribe((data) => {
      this.ecosystems = () => data;
    });

    this.ingestionService.getMarketData().subscribe((data) => {
      this.marketData = () => data;
    });
  }

  onEcosystemChange(event: any): void {
    const id = event.value;
    this.ecosystemService.selectEcosystem(id);
  }

  getStatusLabel(status: 'healthy' | 'drift' | 'critical'): string {
    const labels: Record<string, string> = {
      healthy: 'System Healthy',
      drift: 'Observable Drift',
      critical: 'Critical State',
    };
    return labels[status] || status;
  }

  getIndexColorClass(): string {
    const status = this.index().status;
    const colors: Record<string, string> = {
      healthy: 'text-green-600',
      drift: 'text-amber-600',
      critical: 'text-red-600',
    };
    return colors[status] || 'text-blue-600';
  }

  getResilienceLevel(): 'high' | 'moderate' | 'low' {
    return this.coreService.getResilienceLevel();
  }

  getSnapProbabilityColor(): string {
    const prob = this.snapProbability();
    if (prob > 0.25) return 'text-red-600';
    if (prob > 0.15) return 'text-amber-600';
    return 'text-green-600';
  }

  getResilienceBarColor(value: number): string {
    if (value > 75) return 'color: accent';
    if (value > 50) return 'color: warn';
    return 'color: primary';
  }

  getResilienceStatusColor(value: number): string {
    if (value > 75) return 'text-green-600';
    if (value > 50) return 'text-amber-600';
    return 'text-red-600';
  }

  getTrendColor(): string {
    const trend = this.index().forecastedTrend;
    if (trend === 'improving') return 'text-green-600';
    if (trend === 'deteriorating') return 'text-red-600';
    return 'text-amber-600';
  }

  getNeedleAngle(): number {
    const score = this.index().score;
    return -Math.PI + (Math.PI * score) / 100;
  }

  getStatusChipClass(status: string): string {
    const classes: Record<string, string> = {
      active:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      paused:
        'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
      archived: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    };
    return (
      classes[status] ||
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
    );
  }

  getAlertBgClass(level: string): string {
    const classes: Record<string, string> = {
      critical:
        'bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-700',
      warning:
        'bg-amber-50 dark:bg-amber-900 dark:bg-opacity-20 border border-amber-200 dark:border-amber-700',
      info: 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-700',
    };
    return classes[level] || '';
  }

  getAlertIcon(level: string): string {
    const icons: Record<string, string> = {
      critical: 'error',
      warning: 'warning',
      info: 'info',
    };
    return icons[level] || 'notifications';
  }

  getAlertIconColor(level: string): string {
    const colors: Record<string, string> = {
      critical: 'text-red-600',
      warning: 'text-amber-600',
      info: 'text-blue-600',
    };
    return colors[level] || 'text-gray-600';
  }
}
