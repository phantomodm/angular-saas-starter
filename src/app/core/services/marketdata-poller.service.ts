import { Injectable, effect, signal, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Continuity } from './continuity';

// -------------------------------
// Market session boundaries (ET)
// -------------------------------
function isMarketOpen(now: Date): boolean {
  const h = now.getHours();
  const m = now.getMinutes();
  const minutes = h * 60 + m;

  const pre = 4 * 60; // 04:00
  const open = 9 * 60 + 30; // 09:30
  const post = 20 * 60; // 20:00

  return minutes >= pre && minutes <= post;
}

// -------------------------------
// Align to next timeframe boundary
// -------------------------------
function nextAlignedBoundary(now: Date, minutes: number): Date {
  const next = new Date(now);
  const m = now.getMinutes();
  const remainder = m % minutes;
  const delta = remainder === 0 ? minutes : minutes - remainder;

  next.setMinutes(m + delta);
  next.setSeconds(0);
  next.setMilliseconds(0);

  return next;
}

@Injectable({ providedIn: 'root' })
export class MarketDataPoller {
  private continuity = inject(Continuity);

  // Reactive output to UI
  private mergedSeriesSignal = signal<Record<number, any>>({});
  mergedSeries = this.mergedSeriesSignal.asReadonly();

  // Active symbol + timeframe (in minutes)
  private activeSymbol = signal<string | null>(null);
  private timeframeMinutes = signal<number>(15);

  // Pause/resume state
  private isPaused = false;
  private timerId: any = null;

  // Cache structure
  private cache: Record<
    string,
    {
      lastFetch: number;
      raw: {
        continuity: any[];
        trend: any[];
        acceleration: any[];
        regime: any[];
      };
      merged: Record<number, any>;
    }
  > = {};

  private ttlMs = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Pause/resume on tab visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });

    // React to symbol or timeframe changes
    effect(() => {
      const symbol = this.activeSymbol();
      const minutes = this.timeframeMinutes();

      if (symbol) {
        this.startPolling(symbol, minutes);
      }
    });
  }

  // -------------------------------
  // Public API
  // -------------------------------
  setSymbol(symbol: string) {
    this.activeSymbol.set(symbol);
  }

  setTimeframe(minutes: number) {
    this.timeframeMinutes.set(minutes);
  }

  // -------------------------------
  // Polling lifecycle
  // -------------------------------
  private startPolling(symbol: string, minutes: number) {
    if (this.timerId) clearTimeout(this.timerId);

    // Initial fetch immediately
    this.fetchSymbol(symbol);

    // Schedule next aligned poll
    this.scheduleNextPoll(symbol, minutes);
  }

  private scheduleNextPoll(symbol: string, minutes: number) {
    if (this.isPaused) return;

    const now = new Date();
    const next = nextAlignedBoundary(now, minutes);
    const delay = next.getTime() - now.getTime();

    this.timerId = setTimeout(() => {
      if (!this.isPaused && isMarketOpen(new Date())) {
        this.fetchSymbol(symbol);
      }
      this.scheduleNextPoll(symbol, minutes);
    }, delay);
  }

  pause() {
    this.isPaused = true;
    if (this.timerId) clearTimeout(this.timerId);
  }

  resume() {
    this.isPaused = false;

    const symbol = this.activeSymbol();
    const minutes = this.timeframeMinutes();

    if (symbol) {
      // Fetch immediately on resume
      this.fetchSymbol(symbol);
      // Realign next poll
      this.scheduleNextPoll(symbol, minutes);
    }
  }

  // -------------------------------
  // Fetch + cache + merge
  // -------------------------------
  private fetchSymbol(symbol: string) {
    const now = Date.now();
    const entry = this.cache[symbol];

    // Cache hit
    if (entry && now - entry.lastFetch < this.ttlMs) {
      this.mergedSeriesSignal.set(entry.merged);
      return;
    }

    // Fetch fresh data
    forkJoin({
      continuity: this.continuity.getContinuitySeries(symbol),
      trend: this.continuity.getTrendSeries(symbol),
      acceleration: this.continuity.getAccelerationSeries(symbol),
      regime: this.continuity.getHistoricalRegime(symbol),
      symbolState: this.continuity.getSymbolState(symbol),
    }).subscribe((result) => {
      // Extract the latest regime point
      const lastRegime = result.regime[result.regime.length - 1];

      // Patch symbolState.regime
      if (lastRegime && result.symbolState) {
        result.symbolState.regime = lastRegime.regime;
      }

      const merged = this.mergeSeries(result);

      this.cache[symbol] = {
        lastFetch: now,
        raw: result,
        merged,
      };

      this.mergedSeriesSignal.set(merged);
    });
  }

  private mergeSeries(result: any) {
  const map: Record<number, any> = {};

  // Helper to add any series into the map
  const add = (series: any[], key: string) => {
    for (const p of series) {
      const ts = new Date(p.timestamp).getTime();
      if (!map[ts]) map[ts] = {};
      map[ts][key] = p.value ?? p.regime;
    }
  };

  // Add all raw series
  add(result.continuity, 'continuity');
  add(result.trend, 'trend');
  add(result.acceleration, 'acceleration');
  add(result.regime, 'regime'); // daily regime timestamps

  // Attach symbolState (patched earlier)
  if (result.symbolState) {
    for (const ts of Object.keys(map)) {
      map[+ts].symbolState = result.symbolState;
    }
  }

  // -----------------------------------------
  // FORWARD-FILL DAILY REGIME INTO INTRADAY
  // -----------------------------------------

  // Convert daily regime series into timestamp → regime pairs
  const dailyRegimes = result.regime.map((r: { timestamp: string | number | Date; regime: any; }) => ({
    ts: new Date(r.timestamp).getTime(),
    regime: r.regime
  }));

  // Sort daily regimes by timestamp
  dailyRegimes.sort((a: { ts: number; }, b: { ts: number; }) => a.ts - b.ts);

  // Forward-fill regime for every timestamp in the merged map
  const sortedTs = Object.keys(map).map(Number).sort((a, b) => a - b);

  for (const ts of sortedTs) {
    // Find the latest daily regime before or at this timestamp
    const match = dailyRegimes.filter((r: { ts: number; }) => r.ts <= ts).pop();

    if (match) {
      map[ts].regime = match.regime;
    }
  }

  return map;
}

  // private mergeSeries(result: any) {
  //   console.log(result.regime);
  //   const map: Record<number, any> = {};
  //   const add = (series: any[], key: string) => {
  //     for (const p of series) {
  //       const ts = new Date(p.timestamp).getTime();
  //       if (!map[ts]) map[ts] = {};
  //       map[ts][key] = p.value ?? p.regime;
  //     }
  //   };

  //   add(result.continuity, 'continuity');
  //   add(result.trend, 'trend');
  //   add(result.acceleration, 'acceleration');
  //   add(result.regime, 'regime');

  //   if (result.symbolState) {
  //     for (const ts of Object.keys(map)) {
  //       map[+ts].symbolState = result.symbolState; // add, not replace
  //     }
  //   }
  //   return map;
  // }
}
