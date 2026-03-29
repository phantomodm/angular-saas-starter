import { Component, computed, effect, inject, signal } from '@angular/core';
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
  det = inject(CollapseDetectorService);
  replayIndex = signal(0);
  isReplaying = signal(false);
  
  history = this.momentum.history;
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
  collapseProbabilitySeries = computed(() => [
    {
      name: 'Collapse Probability',
      type: 'line',
      data: this.history().map((h) => [
        new Date(h.timestamp).getTime(),
        h.collapse_probability,
      ]),
      stroke: { width: 2, dashArray: 4 },
      color: '#ff0000',
    },
  ]);

  priceSeries = computed(() => [
    {
      name: 'Mid Price',
      data: this.history().map((h) => [new Date(h.timestamp).getTime(), h.mid]),
    },
    ...this.collapseProbabilitySeries(),
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

  startReplay() {
    this.isReplaying.set(true);
    this.replayIndex.set(0);

    const interval = setInterval(() => {
      if (!this.isReplaying()) return clearInterval(interval);

      const idx = this.replayIndex();
      const h = this.history()[idx];

      if (!h) return clearInterval(interval);

      const sliced = this.history()
        .slice(0, idx)
        .map((p) => [new Date(p.timestamp).getTime(), p.mid]);

      if (this.priceChart) {
        this.priceChart.updateSeries([{ data: sliced }], false);
      }

      this.replayIndex.set(idx + 1);
    }, 100);
  }

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
