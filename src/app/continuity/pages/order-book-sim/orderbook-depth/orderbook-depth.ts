import { Component, computed, inject } from '@angular/core';
import { SimulatorService } from '../../../../core/services/simulator.service';
import { MatCardModule } from "@angular/material/card";
import { RegimeIndicator } from "../regime-indicator/regime-indicator";

@Component({
  selector: 'app-orderbook-depth',
  imports: [MatCardModule, RegimeIndicator],
  templateUrl: './orderbook-depth.html',
  styleUrl: './orderbook-depth.css',
})
export class OrderbookDepth {
  private momentumService = inject(SimulatorService);
  momentum = this.momentumService.momentum;

  // Extract L2 bids/asks
  bids = computed(() => {
    const m = this.momentum();
    return m ? m.level2?.bids?.map(([price, qty]) => ({ price, qty })) : [];
  });

  asks = computed(() => {
    const m = this.momentum();
    return m ? m.level2?.asks?.map(([price, qty]) => ({ price, qty })) : [];
  });

  // Track last prices for color movement
  lastBidPrice = 0;
  lastAskPrice = 0;

}
