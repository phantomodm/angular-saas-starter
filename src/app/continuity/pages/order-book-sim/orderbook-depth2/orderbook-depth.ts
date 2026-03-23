import { Component, effect, inject, signal, computed } from '@angular/core';
import {
  MomentumState,
  SimulatorService,
} from '../../../../core/services/simulator.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-orderbook-depth2',
  standalone: true,
  imports: [MatCardModule, CommonModule, DecimalPipe],
  templateUrl: './orderbook-depth.html',
  styleUrl: './orderbook-depth.scss',
})
export class OrderbookDepth2 {
  private momentumService = inject(SimulatorService);
  momentum = this.momentumService.momentum;

  Math = Math;

  private rawBids = signal<{ price: number; qty: number }[]>([]);
  private rawAsks = signal<{ price: number; qty: number }[]>([]);

  ladderStep = signal<number>(1);

  bids = computed(() =>
    this.groupLevels(this.rawBids(), this.ladderStep(), 'bids')
  );
  asks = computed(() =>
    this.groupLevels(this.rawAsks(), this.ladderStep(), 'asks')
  );

  lastBidPrice: number | null = null;
  lastAskPrice: number | null = null;

  constructor() {
    effect(() => {
      const state = this.momentum();
      if (state) this.updateFromState(state);
    });
  }

  updateFromState(state: MomentumState) {
    this.rawBids.set(
      state.level2.bids.map(([price, qty]) => ({ price, qty }))
    );
    this.rawAsks.set(
      state.level2.asks.map(([price, qty]) => ({ price, qty }))
    );

    this.lastBidPrice = state.level1.best_bid?.[0] ?? null;
    this.lastAskPrice = state.level1.best_ask?.[0] ?? null;
  }

  groupLevels(
    levels: { price: number; qty: number }[],
    step: number,
    side: 'bids' | 'asks'
  ): { price: number; qty: number; cumQty: number }[] {
    if (!step || step <= 0) step = 1;
    const map = new Map<number, number>();

    for (const l of levels) {
      const groupedPrice = Math.floor(l.price / step) * step;
      map.set(groupedPrice, (map.get(groupedPrice) ?? 0) + l.qty);
    }

    const sorted = Array.from(map.entries())
      .map(([price, qty]) => ({ price, qty }))
      .sort((a, b) =>
        side === 'bids' ? b.price - a.price : a.price - b.price
      );

    let cum = 0;
    return sorted.map((l) => {
      cum += l.qty;
      return { ...l, cumQty: cum };
    });
  }

  getDepthPercent(qty: number, maxQty: number) {
    if (!maxQty) return 0;
    return (qty / maxQty) * 100;
  }

  getCumulativeDepthPercent(cumQty: number, totalQty: number) {
    if (!totalQty) return 0;
    return (cumQty / totalQty) * 100;
  }

  get maxBidQty() {
    return Math.max(...this.bids().map((b) => b.qty), 1);
  }

  get maxAskQty() {
    return Math.max(...this.asks().map((a) => a.qty), 1);
  }

  get totalBidQty() {
    return this.bids().reduce((s, b) => s + b.qty, 0);
  }

  get totalAskQty() {
    return this.asks().reduce((s, a) => s + a.qty, 0);
  }

  get bidImbalance() {
    const tb = this.totalBidQty;
    const ta = this.totalAskQty;
    if (!tb && !ta) return 0;
    return (tb - ta) / (tb + ta);
  }

  getImbalanceColor() {
    const x = this.bidImbalance;
    if (x > 0.05) return '#22c55e';
    if (x < -0.05) return '#ef4444';
    return '#eab308';
  }

  getHeatColor(qty: number, maxQty: number) {
    if (!maxQty) return '#4b5563';
    const r = qty / maxQty;
    if (r > 0.8) return '#22c55e';
    if (r > 0.5) return '#84cc16';
    if (r > 0.2) return '#eab308';
    return '#ef4444';
  }

  setLadder(step: number) {
    this.ladderStep.set(step);
  }
}