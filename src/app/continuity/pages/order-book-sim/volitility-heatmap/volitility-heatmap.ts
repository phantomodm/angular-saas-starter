import { Component, computed, inject } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexTooltip,
} from 'ng-apexcharts';
import { SimulatorService } from '../../../../core/services/simulator.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatCardModule } from '@angular/material/card';

export interface VolHeatmapOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
  colors: string[];
}

@Component({
  selector: 'app-volatility-heatmap',
  imports: [NgApexchartsModule, MatCardModule],
  template: `
    <mat-card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Volatility Heatmap</h2>

      <apx-chart
        [series]="volatilitySeries()"
        [chart]="chartOptions.chart"
        [plotOptions]="chartOptions.plotOptions"
        [dataLabels]="chartOptions.dataLabels"
        [colors]="chartOptions.colors"
        [xaxis]="chartOptions.xaxis"
        [yaxis]="chartOptions.yaxis"
        [tooltip]="chartOptions.tooltip"
      ></apx-chart>
    </mat-card>
  `,
})
export class VolatilityHeatmap {
  momentum = inject(SimulatorService);
  history = this.momentum.history;

  constructor() {}

  volatilitySeries = computed<ApexAxisChartSeries>(() => [{
    name: 'Volatility',
    data: this.history().map((h, i, arr) => {
      if (i === 0) return { x: '', y: 0 };

      const prev = arr[i - 1];
      const vol = Math.abs(h.mid - prev.mid);

      return {
        x: new Date(h.timestamp).toLocaleTimeString(),
        y: Math.round(vol * 10000),
        meta: {
          continuity: h.continuity,
          trend: h.trend,
          acceleration: h.acceleration,
          regime: h.regime
        }
      };
    })
  }]);

  chartOptions: VolHeatmapOptions = {
    series: [],
    chart: {
      type: 'heatmap',
      height: 250,
      animations: { enabled: true },
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 2,
        colorScale: {
          ranges: [
            { from: 0, to: 10, color: '#00b050', name: 'Low' },
            { from: 11, to: 30, color: '#ffff00', name: 'Medium' },
            { from: 31, to: 60, color: '#ff9900', name: 'High' },
            { from: 61, to: 9999, color: '#ff0000', name: 'Extreme' }
          ]
        }
      }
    },
    xaxis: { labels: { show: false } },
    yaxis: { labels: { show: false } },
    tooltip: {
      enabled: true,
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const point = w.config.series[seriesIndex].data[dataPointIndex];
        const m = point.meta;

        return `
          <div style="padding:8px">
            <strong>Regime:</strong> ${m.regime}<br>
            <strong>Continuity:</strong> ${m.continuity.toFixed(5)}<br>
            <strong>Trend:</strong> ${m.trend.toFixed(5)}<br>
            <strong>Acceleration:</strong> ${m.acceleration.toFixed(5)}
          </div>
        `;
      }
    },
    colors: ['#00FF00']
  };

}
