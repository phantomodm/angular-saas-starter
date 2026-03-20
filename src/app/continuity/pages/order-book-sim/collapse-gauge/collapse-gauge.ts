import { Component, computed, inject } from '@angular/core';
import {
  ApexChart,
  ApexFill,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexNonAxisChartSeries,
} from 'ng-apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatCardModule } from '@angular/material/card';
import { SimulatorService } from '../../../../core/services/simulator.service';

export interface GaugeOptions {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  labels: string[];
}

@Component({
  selector: 'app-collapse-gauge',
  imports: [NgApexchartsModule, MatCardModule],
  template: `
    <mat-card class="p-4 text-center">
      <h2 class="text-lg font-semibold mb-4">Collapse Probability</h2>

      <apx-chart
        [series]="[collapseValue()]"
        [chart]="chartOptions.chart"
        [plotOptions]="chartOptions.plotOptions"
        [fill]="chartOptions.fill"
        [stroke]="chartOptions.stroke"
        [labels]="chartOptions.labels"
      ></apx-chart>
      <div class="mt-4 text-sm text-gray-400">
    Stability Score: <strong>{{ stabilityScore() }}%</strong>
  </div>

  <div class="mt-2 text-xs uppercase tracking-wide"
       [class]="{
         'text-green-400': regime() === 'neutral',
         'text-blue-400': regime() === 'trending_up',
         'text-purple-400': regime() === 'trending_down',
         'text-yellow-400': regime() === 'high_vol',
         'text-red-500': regime() === 'collapse'
       }">
    Regime: {{ regime() }}
  </div>

    </mat-card>
  `,
})
export class CollapseGaugeComponent {
  momentumService = inject(SimulatorService);
  momentum = this.momentumService.momentum;

  constructor() {}

  regime = computed(() => this.momentum()?.regime ?? 'neutral');

  icon = computed(() => {
    switch (this.regime()) {
      case 'trending_up': return 'trending_up';
      case 'trending_down': return 'trending_down';
      case 'mean_revert': return 'sync';
      case 'high_vol': return 'flash_on';
      case 'collapse': return 'warning';
      default: return 'horizontal_rule';
    }
  });

  color = computed(() => {
    switch (this.regime()) {
      case 'trending_up': return 'text-green-400';
      case 'trending_down': return 'text-purple-400';
      case 'mean_revert': return 'text-blue-400';
      case 'high_vol': return 'text-yellow-400';
      case 'collapse': return 'text-red-500';
      default: return 'text-gray-400';
    }
  });

  collapseValue = computed(() =>
    Math.round((this.momentum()?.collapse_probability ?? 0) * 100)
  );

  stabilityScore = computed(() =>
    Math.round((1 - (this.momentum()?.collapse_probability ?? 0)) * 100)
  );

  regime = computed(() => this.momentum()?.regime ?? 'neutral');

  chartOptions: GaugeOptions = {
    series: [0],
    chart: {
      type: 'radialBar',
      height: 280,
      animations: { enabled: true }
    },
    plotOptions: {
      radialBar: {
        hollow: { size: '60%' },
        track: { background: '#333' },
        dataLabels: {
          name: { show: true, color: '#888' },
          value: {
            show: true,
            fontSize: '24px',
            formatter: (v: number) => `${v}%`
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        gradientToColors: ['#ff0000'],
        stops: [0, 100]
      }
    },
    stroke: { lineCap: 'round' },
    tooltip: { enabled: false },
    labels: ['Collapse Probability']
  };

}
