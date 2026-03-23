import { Component, computed, inject, signal } from '@angular/core';
import {
  MomentumState,
  SimulatorService,
} from '../../../../core/services/simulator.service';
import { MatCardModule } from '@angular/material/card';
import { RegimeIndicator } from '../regime-indicator/regime-indicator';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-orderbook-depth',
  imports: [MatCardModule, RegimeIndicator, DecimalPipe, CommonModule],
  templateUrl: './orderbook-depth.html',
  styleUrl: './orderbook-depth.scss',
})
export class OrderbookDepth {
  private momentumService = inject(SimulatorService);
  momentum = this.momentumService.momentum;
  
  lastBidPrice: number | null = null;
  lastAskPrice: number | null = null;
  Math = Math; // expose Math to template

  // Extract L2 bids/asks
  // bids = computed(() => {
  //   const m = this.momentum();
  //   return m ? m.level2?.bids?.map(([price, qty]) => ({ price, qty })) : [];
  // });

  // asks = computed(() => {
  //   const m = this.momentum();
  //   return m ? m.level2?.asks?.map(([price, qty]) => ({ price, qty })) : [];
  // });

  // maxBidQty = computed(() => Math.max(...this.bids().map((b) => b.qty), 1));

  // maxAskQty = computed(() => Math.max(...this.asks().map((a) => a.qty), 1));

  // // Track last prices for color movement
  // lastBidPrice = 0;
  // lastAskPrice = 0;

  // formatPrice(p: number) {
  //   return p.toFixed(2);
  // }
  // formatQty(q: number) {
  //   return q.toFixed(4);
  // }
  // getDepthPercent(qty: number, maxQty: number) {
  //   return (qty / maxQty) * 100;
  // }
  bids = signal<{ price: number; qty: number }[]>([]);
  asks = signal<{ price: number; qty: number }[]>([]);

  getDepthPercent(qty: number, maxQty: number) {
    if (!maxQty) return 0;
    return (qty / maxQty) * 100;
  }

  getCumulativeDepthPercent(cumQty: number, totalQty: number) {
    if (!totalQty) return 0;
    return (cumQty / totalQty) * 100;
  }

  get maxBidQty() {
    return Math.max(...this.bids().map((b: { qty: any }) => b.qty), 1);
  }

  get maxAskQty() {
    return Math.max(...this.asks().map((a: { qty: any }) => a.qty), 1);
  }

  get totalBidQty() {
    return this.bids().reduce((s: any, b: { qty: any }) => s + b.qty, 0);
  }

  get totalAskQty() {
    return this.asks().reduce((s: any, a: { qty: any }) => s + a.qty, 0);
  }

  get bidImbalance() {
    const tb = this.totalBidQty;
    const ta = this.totalAskQty;
    if (!tb && !ta) return 0;
    return (tb - ta) / (tb + ta);
  }

  updateFromState(state: MomentumState) {
    // Convert L2 arrays into objects
    this.bids.set(state.level2.bids.map(([price, qty]) => ({ price, qty })));
    this.asks.set(state.level2.asks.map(([price, qty]) => ({ price, qty })));

    // BEST BID / BEST ASK come from level1
    this.lastBidPrice = state.level1.best_bid?.[0] ?? null;
    this.lastAskPrice = state.level1.best_ask?.[0] ?? null;
  }
}
