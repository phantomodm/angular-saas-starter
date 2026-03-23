import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'ce-timeframe-filter',
  imports: [CommonModule, MatButtonToggleModule],
  templateUrl: './timeframe-filter.html',
  styleUrl: './timeframe-filter.scss',
})
export class TimeframeFilter {
  resolution = model<string>('15m');
  window = model<string>('1m');

  resolutions = [
    { value: '5m', label: '5m' },
    { value: '10m', label: '10m' },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1D' },
  ];

  windows = [
    { value: '1d', label: '1D' },
    { value: '5d', label: '5D' },
    { value: '1w', label: '1W' },
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '5y', label: '5Y' },
    { value: 'max', label: 'MAX' },
  ];

  onResolutionChange(r: string) {
    this.resolution.set(r);
  }

  onWindowChange(w: string) {
    this.window.set(w);
  }
}
