import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { SimulatorService } from '../../../core/services/simulator.service';
import { TradeTape } from './trade-tape/trade-tape';
import { MicrostructureCharts } from './microstructure-charts/microstructure-charts';
import { OrderbookDepth } from './orderbook-depth/orderbook-depth';
import { SymbolSelector } from './symbol-selector/symbol-selector';
import { MomentumOverview } from './momentum-overview/momentum-overview';
import { ScheerHeatmap } from './scheer-heatmap/scheer-heatmap';
import { VolatilityHeatmap } from './volitility-heatmap/volitility-heatmap';
import { CollapseGaugeComponent } from './collapse-gauge/collapse-gauge';
import { RegimeIndicator } from './regime-indicator/regime-indicator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { OrderbookDepth2 } from './orderbook-depth2/orderbook-depth';
import { ScheerDepthHeatmap } from './scheer-heatmap/scheer-depth-heatmap';
import { CollapseBanner } from '../../components/collapse-banner/collapse-banner';
import { CollapseAlerts } from '../collapse-alerts/collapse-alerts';
import { BotPanelComponent } from '../../components/bot-panel/bot-panel';
import { FibonacciAnalyticsComponent, FibonacciLevels, SimulatorState} from '../../components/fib-panel/fibonacci-analytics';

@Component({
  selector: 'app-order-book-sim',
  imports: [
    TradeTape,
    MicrostructureCharts,
    OrderbookDepth2,
    SymbolSelector,
    MomentumOverview,
    ScheerHeatmap,
    ScheerDepthHeatmap,
    VolatilityHeatmap,
    CollapseGaugeComponent,
    RegimeIndicator,
    MatButtonToggleModule,
    CollapseBanner,
    CollapseAlerts,
    BotPanelComponent,
    FibonacciAnalyticsComponent,
  ],
  templateUrl: './order-book-sim.html',
  styleUrl: './order-book-sim.scss',
})
export class OrderBookSim implements OnDestroy {
  private momentumService = inject(SimulatorService);

  levels = signal<number[]>([0.236, 0.382, 0.5, 0.618, 0.786]);

  signal = computed<'long' | 'short' | 'neutral'>(() => {
    const history = this.history();
    if (!history.length) return 'neutral';

    const last = history[history.length - 1];

    // simple example logic
    if (last.trend > 0 && last.acceleration > 0) return 'long';
    if (last.trend < 0 && last.acceleration < 0) return 'short';
    return 'neutral';
  });

  momentum = this.momentumService.momentum;
  direction = this.momentumService.direction;
  collapseWarning = this.momentumService.collapseWarning;
  history = this.momentumService.history;

  mode = this.momentumService.mode;
  symbol = this.momentumService.selectedSymbol;
  sim = computed<SimulatorState | null>(() => {
  const history = this.history();
  if (!history.length) return null;

  const last = history[history.length - 1];

  // Convert your array signal into the object the UI expects
  const levelsArray = this.levels(); // e.g. [0.236, 0.382, 0.5, ...]
  const mid = last.mid;

  const fibLevels: FibonacciLevels = {
    fib_236: mid * (1 - levelsArray[0]),
    fib_382: mid * (1 - levelsArray[1]),
    fib_500: mid * (1 - levelsArray[2]),
    fib_618: mid * (1 - levelsArray[3]),
    fib_786: mid * (1 - levelsArray[4]),
    ext_127: mid * (1 + 0.127),
    ext_161: mid * (1 + 0.161),
    ext_261: mid * (1 + 0.261),
  };

  return {
    ...last,
    mid_price: last.mid,
    fibonacci_enabled: true,
    fibonacci_levels: fibLevels,
    fibonacci_signal: this.signal(),
  };
});


  constructor() {}

  setMode(mode: 'simulator' | 'replay' | 'live') {
    this.mode.set(mode);
  }

  setSymbol(symbol: string) {
    this.symbol.set(symbol);
  }

  selectSymbol(symbol: string) {
    this.momentumService.selectedSymbol.set(symbol);
  }

  ngOnDestroy(): void {
    this.momentumService.disconnect();
  }
}
