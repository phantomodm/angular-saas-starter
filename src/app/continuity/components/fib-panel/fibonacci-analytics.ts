import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';

import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType
} from 'chart.js';

import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

interface FibonacciLevels {
  [key: string]: number;
}

interface SimulatorState {
  fibonacci_enabled: boolean;
  fibonacci_levels: FibonacciLevels | null;
  fibonacci_signal: string | null;
  mid_price: number;
}

interface FibConfluenceRow {
  level: string;
  price: number;
  distance: number;
  score: number;
}

@Component({
  selector: 'app-fibonacci-analytics',
  templateUrl: './fibonacci-analytics.html',
})
export class FibonacciAnalyticsComponent implements OnChanges, AfterViewInit {
  @Input() sim!: SimulatorState | null;

  @ViewChild('fibChartCanvas') fibChartCanvas!: ElementRef<HTMLCanvasElement>;

  chart!: Chart;

  priceHistory: number[] = [];
  maxHistory = 200;

  fibKeys = [
    'fib_236',
    'fib_382',
    'fib_500',
    'fib_618',
    'fib_786',
    'ext_127',
    'ext_161',
    'ext_261'
  ];

  fibConfluence: FibConfluenceRow[] = [];

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.sim) return;

    // Track mid-price
    this.priceHistory.push(this.sim.mid_price);
    if (this.priceHistory.length > this.maxHistory) {
      this.priceHistory.shift();
    }

    // Update confluence
    if (this.sim.fibonacci_enabled) {
      this.computeFibConfluence();
    }

    // Update chart
    if (this.chart) {
      this.updateChart();
    }
  }

  private initChart(): void {
    this.chart = new Chart(this.fibChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Mid Price',
            data: [],
            borderColor: '#4f46e5',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.25
          }
        ]
      },
      options: {
        responsive: true,
        animation: false,
        plugins: {
          legend: { display: false },
          annotation: { annotations: {} }
        },
        scales: {
          x: { display: false },
          y: { display: true }
        }
      }
    });
  }

  private updateChart(): void {
    if (!this.sim) return;

    // Update price series
    this.chart.data.labels = this.priceHistory.map((_, i) => i);
    this.chart.data.datasets[0].data = this.priceHistory;

    // Update Fibonacci overlay
    if (this.sim.fibonacci_enabled && this.sim.fibonacci_levels) {
      const fib = this.sim.fibonacci_levels;

      const annotations: any = {};

      Object.keys(fib).forEach((key) => {
        annotations[key] = {
          type: 'line',
          borderColor: 'rgba(255,165,0,0.6)',
          borderWidth: 1,
          scaleID: 'y',
          value: fib[key],
          label: {
            display: true,
            content: key.toUpperCase(),
            position: 'start',
            backgroundColor: 'rgba(255,165,0,0.2)',
            color: '#000'
          }
        };
      });

      this.chart.options.plugins!.annotation!.annotations = annotations;
    } else {
      this.chart.options.plugins!.annotation!.annotations = {};
    }

    this.chart.update();
  }

  private computeFibConfluence(): void {
    if (!this.sim || !this.sim.fibonacci_levels) {
      this.fibConfluence = [];
      return;
    }

    const mid = this.sim.mid_price;
    const levels = this.sim.fibonacci_levels;

    this.fibConfluence = Object.keys(levels).map((key) => {
      const price = levels[key];
      const distance = Math.abs(mid - price);
      const score = 1 / (1 + distance);

      return { level: key, price, distance, score };
    });
  }
}
