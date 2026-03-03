import { Directive, model } from '@angular/core';

export const timeRanges = ['5m', '15m', '30m', '1h', '4h', '1d', '5d', '1m', '3m', '6m', '1y', '5y', 'MAX'] as const;
export type TimeRange = (typeof timeRanges)[number];

@Directive()
export abstract class TimeframeAwareComponent {
  // Two-way bound signals

  selectedSymbol = model<string>('QQQ');
  selectedCategory = model<string>('Equities');

  // Parent components must implement this
  abstract loadSymbolData(symbol: string): Promise<void>;

  async onTimeframeChange() {
    const symbol = this.selectedSymbol();

    if (!symbol) return;

    await this.loadSymbolData(symbol);
  }
}