import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { SimulatorService } from '../../../core/services/simulator.service';
import { TradeTape } from "./trade-tape/trade-tape";
import { MicrostructureCharts } from "./microstructure-charts/microstructure-charts";
import { OrderbookDepth } from "./orderbook-depth/orderbook-depth";
import { SymbolSelector } from "./symbol-selector/symbol-selector";
import { MomentumOverview } from "./momentum-overview/momentum-overview";
import { ScheerHeatmap } from "./scheer-heatmap/scheer-heatmap";
import { VolatilityHeatmap } from "./volitility-heatmap/volitility-heatmap";
import { CollapseGaugeComponent } from "./collapse-gauge/collapse-gauge";
import { RegimeIndicator } from "./regime-indicator/regime-indicator";
import { MatButtonToggleModule } from "@angular/material/button-toggle";

@Component({
  selector: 'app-order-book-sim',
  imports: [TradeTape, MicrostructureCharts, OrderbookDepth, SymbolSelector, MomentumOverview, ScheerHeatmap, VolatilityHeatmap, CollapseGaugeComponent, RegimeIndicator, MatButtonToggleModule],
  templateUrl: './order-book-sim.html',
  styleUrl: './order-book-sim.css',
})
export class OrderBookSim implements  OnDestroy {
  private momentumService = inject(SimulatorService);
  momentum = this.momentumService.momentum;
  direction = this.momentumService.direction;
  collapseWarning = this.momentumService.collapseWarning;
  history = this.momentumService.history;

  mode = this.momentumService.mode;
  symbol = this.momentumService.selectedSymbol;


  constructor() {   

  }

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
