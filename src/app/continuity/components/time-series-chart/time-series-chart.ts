import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { SeriesPoint } from '../../../core/models/types';

@Component({
  selector: 'time-series-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, NgChartsModule],
  templateUrl: './time-series-chart.html',
  styleUrls: ['./time-series-chart.scss'],
})
export class TimeSeriesChart implements OnChanges {
  @Input() title = '';
  @Input() data: SeriesPoint[] = [];
  @Input() color = '#3b82f6';
  @Input() highlightSpikes = false;

  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { display: false }, y: { display: true } },
    plugins: { legend: { display: false } },
  };

  ngOnChanges() {
    const labels = this.data.map(d => new Date(d.timestamp).toLocaleString());
    const values = this.data.map(d => d.value);

    this.chartData = {
      labels,
      datasets: [
        {
          data: values,
          borderColor: this.color,
          backgroundColor: 'rgba(0,0,0,0)',
          pointRadius: this.highlightSpikes ? 3 : 1.5,
          tension: 0.25,
        },
      ],
    };
  }
}

