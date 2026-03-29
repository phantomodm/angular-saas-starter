import { Injectable, signal, effect, inject } from '@angular/core';
import { MomentumState, SimulatorService } from './simulator.service';

@Injectable({ providedIn: 'root' })
export class CollapseDetectorService {
  private sim = inject(SimulatorService);
  momentum = this.sim.momentum;

  // PUBLIC SIGNALS (must exist for template)
  latestEvent = signal<any | null>(null);
  collapseEvents = signal<any[]>([]);
  lastEventTime = 0;
  cooldownMs = 5000; // 5 seconds
  private lastBidDepth = 0;
  private lastSpread = 0;

  constructor() {
    effect(() => {
      const m = this.momentum();
      if (!m) return;

      const bidDepth = m.level2.bids.reduce((s, [_, q]) => s + q, 0);
      const askDepth = m.level2.asks.reduce((s, [_, q]) => s + q, 0);

      const bidDepthDrop = this.lastBidDepth
        ? (this.lastBidDepth - bidDepth) / this.lastBidDepth
        : 0;

      const spread = m.level1.best_ask[0] - m.level1.best_bid[0];
      const spreadWidening = this.lastSpread
        ? (spread - this.lastSpread) / this.lastSpread
        : 0;

      const imbalance = (bidDepth - askDepth) / (bidDepth + askDepth || 1);

      const conditions = {
        collapse_probability: m.collapse_probability > 0.65,
        continuity: m.continuity < -0.15,
        trend: m.trend < -0.12,
        acceleration: m.acceleration < -0.05,
        bid_depth_drop: bidDepthDrop > 0.3,
        imbalance: imbalance < -0.1,
        spread_widening: spreadWidening > 0.2,
        scheer_intensity: m.scheer_intensity > 0.6,
      };

      const triggered = Object.values(conditions).every(Boolean);

      // if (triggered) {
      //   const evt = {
      //     timestamp: m.timestamp,
      //     message: this.explain(conditions),
      //     conditions,
      //   };

      //   this.latestEvent.set(evt);
      //   this.collapseEvents.update(log => [...log, evt]);
      // }
      const now = Date.now();
      if (now - this.lastEventTime < this.cooldownMs) {
        return; // skip event
      }
      this.lastEventTime = now;

      if (triggered) {
        const severity = this.getSeverity(m, { bidDepthDrop });

        const evt = {
          timestamp: m.timestamp,
          severity,
          message: this.explain(conditions),
          conditions,
        };

        this.latestEvent.set(evt);
        this.collapseEvents.update((log) => [...log, evt]);
        const clusters = this.clusterEvents(this.collapseEvents());
        console.log('Collapse Clusters:', clusters);
      }

      this.lastBidDepth = bidDepth;
      this.lastSpread = spread;
    });
  }

  clusterEvents(events: any[]) {
    const clusters = [];
    let current = [events[0]];

    for (let i = 1; i < events.length; i++) {
      const prev = new Date(events[i - 1].timestamp).getTime();
      const curr = new Date(events[i].timestamp).getTime();

      if (curr - prev < 5000) {
        current.push(events[i]);
      } else {
        clusters.push(current);
        current = [events[i]];
      }
    }

    clusters.push(current);
    return clusters;
  }

  getSeverity(m: MomentumState, metrics: any) {
    const score =
      m.collapse_probability * 0.4 +
      Math.abs(m.continuity) * 0.2 +
      Math.abs(m.trend) * 0.2 +
      metrics.bidDepthDrop * 0.2;

    if (score > 0.75) return 'red';
    if (score > 0.45) return 'orange';
    return 'yellow';
  }

  explain(c: any) {
    const reasons = [];

    if (c.bid_depth_drop) reasons.push('Bid depth evaporated >30%');
    if (c.imbalance) reasons.push('Order book imbalance flipped negative');
    if (c.spread_widening) reasons.push('Spread widening (liquidity retreat)');
    if (c.continuity) reasons.push('Continuity break (flow disruption)');
    if (c.trend) reasons.push('Trend turned negative');
    if (c.acceleration) reasons.push('Acceleration negative (momentum loss)');
    if (c.scheer_intensity) reasons.push('Scheer intensity spike');
    if (c.collapse_probability) reasons.push('Collapse probability high');

    return reasons.join(', ');
  }
}
