import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { SimulatorService } from '../../../../core/services/simulator.service';

import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexTooltip
} from 'ng-apexcharts';


export interface HeatmapChartOptions {
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
  selector: 'app-scheer-heatmap',
  imports: [MatCardModule, NgApexchartsModule],
  template: `
    <mat-card class="p-4">
  <h2 class="text-lg font-semibold mb-4">Scheer Intensity Heatmap</h2>

  <apx-chart
    [series]="heatmapSeries()"
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
  styles: ``,
})
export class ScheerHeatmap {
  momentum = inject(SimulatorService);
  history = this.momentum.history;

  constructor() {}

  // Transform history into heatmap format
  heatmapSeries = computed<ApexAxisChartSeries>(() => [{
    name: 'Scheer Intensity',
    data: this.history().map(h => ({
      x: new Date(h.timestamp).toLocaleTimeString(),
      y: Math.round(h.scheer_intensity * 100)
    }))
  }]);

  // FULLY DEFINED, NO OPTIONALS
  chartOptions: HeatmapChartOptions = {
    series: [],
    chart: {
      type: 'heatmap',
      height: 250,
      animations: { enabled: true },
      toolbar: { show: false }
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 2,
        colorScale: {
          ranges: [
            { from: 0, to: 20, color: '#00b050', name: 'Low' },
            { from: 21, to: 50, color: '#ffff00', name: 'Medium' },
            { from: 51, to: 80, color: '#ff9900', name: 'High' },
            { from: 81, to: 100, color: '#ff0000', name: 'Critical' }
          ]
        }
      }
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: {
      labels: { show: false }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) => `${val}% intensity`
      }
    },
    colors: ['#00FF00']
  };


}
