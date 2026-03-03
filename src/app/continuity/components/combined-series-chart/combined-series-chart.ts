import { Component, OnChanges, signal, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { SeriesPoint } from '../../../core/models/types';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'ce-combined-series-chart',
  imports: [MatCardModule, NgChartsModule],
  templateUrl: './combined-series-chart.html',
  styleUrl: './combined-series-chart.css',
})
export class CombinedSeriesChart implements OnChanges {
  continuity = input<SeriesPoint[]>([]);
  trend = input<SeriesPoint[]>([]);
  acceleration = input<SeriesPoint[]>([]);

  chartData = signal<ChartConfiguration['data']>({
    labels: [],
    datasets: [],
  });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { display: true },
      y: { display: true },
    },
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: { enabled: true },
    },
  };

  ngOnChanges() {
    const labels = this.continuity().map(p =>
      new Date(p.timestamp).toLocaleString()
    );

    this.chartData.set({
      labels,
      datasets: [
        {
          label: 'Continuity',
          data: this.continuity().map(p => p.value),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22,163,74,0.2)',
          tension: 0.25,
          borderWidth: 2,
        },
        {
          label: 'Trend',
          data: this.trend().map(p => p.value),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.2)',
          tension: 0.25,
          borderWidth: 2,
        },
        {
          label: 'Acceleration',
          data: this.acceleration().map(p => p.value),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220,38,38,0.2)',
          tension: 0.25,
          borderWidth: 2,
        },
      ],
    });
  }

}
