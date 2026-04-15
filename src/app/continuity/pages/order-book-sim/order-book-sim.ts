import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
import { CollapseBanner } from "../../components/collapse-banner/collapse-banner";
import { CollapseAlerts } from "../collapse-alerts/collapse-alerts";
import { BotPanelComponent} from "../../components/bot-panel/bot-panel";
import { FibonacciAnalyticsComponent } from '../../components/fib-panel/fibonacci-analytics';

@Component({
  selector: 'app-order-book-sim',
  imports: [
    TradeTape,
    MicrostructureCharts,
    OrderbookDepth,
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
    FibonacciAnalyticsComponent
],
  templateUrl: './order-book-sim.html',
  styleUrl: './order-book-sim.scss',
})
export class OrderBookSim implements OnDestroy {
  private momentumService = inject(SimulatorService);
  momentum = this.momentumService.momentum;
  direction = this.momentumService.direction;
  collapseWarning = this.momentumService.collapseWarning;
  history = this.momentumService.history;

  mode = this.momentumService.mode;
  symbol = this.momentumService.selectedSymbol;



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
