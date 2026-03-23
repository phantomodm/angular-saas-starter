import { Component, computed, effect, inject } from '@angular/core';
import { SimulatorService } from '../../../../core/services/simulator.service';
import { MatCardModule } from '@angular/material/card';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CollapseDetectorService } from '../../../../core/services/collapse-detector.service';

@Component({
  selector: 'app-microstructure-charts',
  imports: [MatCardModule, NgApexchartsModule],
  templateUrl: './microstructure-charts.html',
  styleUrl: './microstructure-charts.scss',
})
export class MicrostructureCharts {
  momentum = inject(SimulatorService);
  history = this.momentum.history;
  det = inject(CollapseDetectorService);
  priceChart: any = null;
  continuityChart: any = null;
  scheerChart: any = null;

  onPriceChartInit(chart: any) {
    this.priceChart = chart;
  }

  onContinuityChartInit(chart: any) {
    this.continuityChart = chart;
  }

  onScheerChartInit(chart: any) {
    this.scheerChart = chart;
  }

  constructor() {
    effect(() => {
      const evt = this.det.latestEvent();
      if (evt) {
        this.addCollapseMarker(evt);
        this.addCollapseWindow(evt);
      }
    });
  }

  addCollapseWindow(evt: any) {
    const start = new Date(evt.timestamp).getTime();
    const end = start + 10_000; // 10 seconds

    const zone = {
      xaxis: {
        from: start,
        to: end,
        fillColor: 'rgba(255,0,0,0.15)',
        opacity: 0.4,
      },
    };

    if (this.priceChart) this.priceChart.addXaxisAnnotation(zone);
    if (this.continuityChart) this.continuityChart.addXaxisAnnotation(zone);
    if (this.scheerChart) this.scheerChart.addXaxisAnnotation(zone);
  }

  addCollapseMarker(evt: any) {
    const ts = new Date(evt.timestamp).getTime();

    const annotation = {
      x: ts,
      borderColor: '#ff0000',
      label: {
        text: 'Collapse Risk ↑',
        style: {
          color: '#fff',
          background: '#ff0000',
          fontSize: '10px',
        },
      },
      tooltip: {
        enabled: true,
        text: evt.message,
      },
    };

    if (this.priceChart) this.priceChart.addXaxisAnnotation(annotation);
    if (this.continuityChart)
      this.continuityChart.addXaxisAnnotation(annotation);
    if (this.scheerChart) this.scheerChart.addXaxisAnnotation(annotation);
  }
  priceSeries = computed(() => [
    {
      name: 'Mid Price',
      data: this.history().map((h) => [new Date(h.timestamp).getTime(), h.mid]),
    },
  ]);

  continuitySeries = computed(() => [
    {
      name: 'Continuity',
      data: this.history().map((h) => [
        new Date(h.timestamp).getTime(),
        h.continuity,
      ]),
    },
    {
      name: 'Trend',
      data: this.history().map((h) => [
        new Date(h.timestamp).getTime(),
        h.trend,
      ]),
    },
    {
      name: 'Acceleration',
      data: this.history().map((h) => [
        new Date(h.timestamp).getTime(),
        h.acceleration,
      ]),
    },
  ]);

  scheerSeries = computed(() => [
    {
      name: 'Scheer Intensity',
      data: this.history().map((h) => ({
        x: new Date(h.timestamp).toLocaleTimeString(),
        y: h.scheer_intensity,
      })),
    },
  ]);
}
