import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { createChart, ISeriesApi, SeriesMarker } from 'lightweight-charts';
import { SimulatorService } from '../../../core/services/simulator.service';

@Component({
  selector: 'app-trade-view', // Or wherever your chart lives
  template: `<div #chartContainer class="chart-container"></div>`,
  styles: [
    `
      .chart-container {
        width: 100%;
        height: 400px;
      }
    `,
  ],
})
export class TradeView implements OnInit {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  private simulatorService = inject(SimulatorService);
  private chart: any;
  private lineSeries!: ISeriesApi<'Line'>;

  // Array to hold all the bot trade markers
  private markers: SeriesMarker<any>[] = [];
  private lastTradeTime: number = 0; // Prevent duplicate markers for the same trade tick

  constructor() {}

  ngOnInit(): void {
    // 1. Initialize Lightweight Chart
    this.chart = createChart(this.chartContainer.nativeElement, {
      width: this.chartContainer.nativeElement.clientWidth,
      height: 400,
      layout: { background: { color: '#1e1e1e' }, textColor: '#DDD' },
      grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
    });

    this.lineSeries = this.chart.addLineSeries({ color: '#2962FF' });

    // 2. Subscribe to WebSocket Data
    this.simulatorService.connectMomentum().subscribe((data: any) => {
      // Update the chart line with the latest mid-price
      const midPrice =
        (data.snapshot.level1.best_bid[0] + data.snapshot.level1.best_ask[0]) /
        2;
      const timeInSeconds = Math.floor(data.snapshot.timestamp / 1000); // Lightweight charts uses unix seconds by default

      this.lineSeries.update({
        time: timeInSeconds as any,
        value: midPrice,
      });

      // 3. Process Bot Executions into Markers
      if (data.bot_state && data.bot_state.last_trade) {
        const trade = data.bot_state.last_trade;

        // Only add a new marker if it's a new trade (checking timestamp)
        if (trade.time > this.lastTradeTime) {
          this.lastTradeTime = trade.time;

          const isBuy = trade.side === 'buy';

          this.markers.push({
            time: timeInSeconds as any,
            position: isBuy ? 'belowBar' : 'aboveBar',
            color: isBuy ? '#00FF00' : '#FF0000',
            shape: isBuy ? 'arrowUp' : 'arrowDown',
            text: isBuy ? `BUY @ ${trade.price}` : `SELL @ ${trade.price}`,
          });

          // Re-apply markers array to the series (cast to any to access setMarkers)
          (this.lineSeries as any).setMarkers(this.markers);
        }
      }
    });
  }
}
