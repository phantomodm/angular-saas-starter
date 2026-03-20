import { Component, computed, inject } from '@angular/core';
import { SimulatorService } from '../../../../core/services/simulator.service';
import {MatCardModule} from '@angular/material/card';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-microstructure-charts',
  imports: [MatCardModule, NgApexchartsModule],
  templateUrl: './microstructure-charts.html',
  styleUrl: './microstructure-charts.css',
})
export class MicrostructureCharts {
  momentum = inject(SimulatorService);
  history = this.momentum.history;

  constructor() {}

  priceSeries = computed(() => [{
    name: 'Mid Price',
    data: this.history().map(h => [new Date(h.timestamp).getTime(), h.mid])
  }]);

  continuitySeries = computed(() => [{
    name: 'Continuity',
    data: this.history().map(h => [new Date(h.timestamp).getTime(), h.continuity])
  }, {
    name: 'Trend',
    data: this.history().map(h => [new Date(h.timestamp).getTime(), h.trend])
  }, {
    name: 'Acceleration',
    data: this.history().map(h => [new Date(h.timestamp).getTime(), h.acceleration])
  }]);

  scheerSeries = computed(() => [{
    name: 'Scheer Intensity',
    data: this.history().map(h => ({
      x: new Date(h.timestamp).toLocaleTimeString(),
      y: h.scheer_intensity
    }))
  }]);

}
