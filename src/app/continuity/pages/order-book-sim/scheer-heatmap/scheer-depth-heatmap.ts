import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {
  SimulatorService,
  MomentumState,
} from '../../../../core/services/simulator.service';

interface DepthRow {
  price: number;
  bidQty: number;
  askQty: number;
  bidNorm: number;
  askNorm: number;
}

@Component({
  selector: 'app-scheer-depth-heatmap',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './scheer-depth-heatmap.html',
})
export class ScheerDepthHeatmap {
  private sim = inject(SimulatorService);
  momentum = this.sim.momentum;

  scheerIntensity = signal<number>(0);

  private bidsRaw = signal<{ price: number; qty: number }[]>([]);
  private asksRaw = signal<{ price: number; qty: number }[]>([]);

  constructor() {
    effect(() => {
      const state = this.momentum();
      if (state) this.updateFromState(state);
    });
  }

  updateFromState(state: MomentumState) {
    this.scheerIntensity.set(state.scheer_intensity ?? 0);

    this.bidsRaw.set(
      state.level2.bids.map(([price, qty]) => ({ price, qty }))
    );
    this.asksRaw.set(
      state.level2.asks.map(([price, qty]) => ({ price, qty }))
    );
  }

  depthRows = computed<DepthRow[]>(() => {
    const bids = this.bidsRaw();
    const asks = this.asksRaw();

    const prices = new Set<number>();
    bids.forEach(b => prices.add(b.price));
    asks.forEach(a => prices.add(a.price));

    const sortedPrices = Array.from(prices).sort((a, b) => b - a);

    const maxBidQty = Math.max(...bids.map(b => b.qty), 1);
    const maxAskQty = Math.max(...asks.map(a => a.qty), 1);

    return sortedPrices.map(price => {
      const bid = bids.find(b => b.price === price);
      const ask = asks.find(a => a.price === price);

      const bidQty = bid?.qty ?? 0;
      const askQty = ask?.qty ?? 0;

      const bidNorm = bidQty / maxBidQty;
      const askNorm = askQty / maxAskQty;

      return { price, bidQty, askQty, bidNorm, askNorm };
    });
  });

  getBidColor(norm: number): string {
    const i = this.scheerIntensity();
    const alpha = Math.min(1, norm * i);
    return `rgba(34, 197, 94, ${alpha})`; // green
  }

  getAskColor(norm: number): string {
    const i = this.scheerIntensity();
    const alpha = Math.min(1, norm * i);
    return `rgba(239, 68, 68, ${alpha})`; // red
  }
}