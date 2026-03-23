import { Injectable, signal, effect } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

export interface MarketDataPoint {
  ticker: string;
  price: number;
  spread: number;
  interestRate: number;
  timestamp: Date;
  volatility: number;
}

export interface NormalizedSynthesis {
  marketHealth: number; // 0-100
  volatilityIndex: number;
  spreadAverage: number;
  rateOfChange: number;
  timestamp: Date;
}

export interface ContinuityIndex {
  score: number; // 0-100
  status: 'healthy' | 'drift' | 'critical';
  lastUpdated: Date;
  forecastedTrend: 'improving' | 'stable' | 'deteriorating';
}

@Injectable({
  providedIn: 'root'
})
export class IngestionService {
  // RxJS streams for data ingestion
  private marketData$ = new BehaviorSubject<MarketDataPoint[]>([
    {
      ticker: 'SPX',
      price: 5450.12,
      spread: 0.45,
      interestRate: 4.25,
      timestamp: new Date(),
      volatility: 12.5
    },
    {
      ticker: 'EURUSD',
      price: 1.0875,
      spread: 0.0012,
      interestRate: 3.75,
      timestamp: new Date(),
      volatility: 8.3
    },
    {
      ticker: 'USDJPY',
      price: 150.45,
      spread: 0.15,
      interestRate: 4.5,
      timestamp: new Date(),
      volatility: 9.7
    }
  ]);

  private synthesis$ = this.marketData$.pipe(
    map(data => this.normalizeSynthesis(data)),
    startWith(this.normalizeSynthesis([]))
  );

  // Signal-based state for continuity index
  continuityIndexSignal = signal<ContinuityIndex>({
    score: 85,
    status: 'healthy',
    lastUpdated: new Date(),
    forecastedTrend: 'stable'
  });

  // Bridge RxJS to Signal for glitch-free UI updates
  synthesisSignal = toSignal(this.synthesis$, {
    initialValue: this.normalizeSynthesis([])
  });

  constructor() {
    // Simulate real-time data updates
    this.simulateDataStream();
    
    // Update continuity index whenever synthesis changes
    effect(() => {
      const synthesis = this.synthesisSignal();
      this.updateContinuityIndex(synthesis);
    });
  }

  private simulateDataStream(): void {
    // Simulate market data changes every 2 seconds
    interval(2000).subscribe(() => {
      const currentData = this.marketData$.value;
      const updatedData = currentData.map(point => ({
        ...point,
        price: point.price + (Math.random() - 0.5) * 2,
        spread: point.spread + (Math.random() - 0.5) * 0.1,
        volatility: point.volatility + (Math.random() - 0.5) * 2,
        timestamp: new Date()
      }));
      this.marketData$.next(updatedData);
    });
  }

  private normalizeSynthesis(data: MarketDataPoint[]): NormalizedSynthesis {
    if (data.length === 0) {
      return {
        marketHealth: 75,
        volatilityIndex: 10,
        spreadAverage: 0.5,
        rateOfChange: 0,
        timestamp: new Date()
      };
    }

    const avgVolatility = data.reduce((sum, p) => sum + p.volatility, 0) / data.length;
    const avgSpread = data.reduce((sum, p) => sum + p.spread, 0) / data.length;
    const marketHealth = Math.max(0, 100 - avgVolatility * 2);

    return {
      marketHealth,
      volatilityIndex: avgVolatility,
      spreadAverage: avgSpread,
      rateOfChange: (Math.random() - 0.5) * 5,
      timestamp: new Date()
    };
  }

  private updateContinuityIndex(synthesis: NormalizedSynthesis): void {
    let status: 'healthy' | 'drift' | 'critical';
    let trend: 'improving' | 'stable' | 'deteriorating';

    if (synthesis.marketHealth > 80) {
      status = 'healthy';
    } else if (synthesis.marketHealth > 60) {
      status = 'drift';
    } else {
      status = 'critical';
    }

    if (synthesis.rateOfChange > 1) {
      trend = 'improving';
    } else if (synthesis.rateOfChange < -1) {
      trend = 'deteriorating';
    } else {
      trend = 'stable';
    }

    this.continuityIndexSignal.set({
      score: Math.round(synthesis.marketHealth),
      status,
      lastUpdated: new Date(),
      forecastedTrend: trend
    });
  }

  getMarketData(): Observable<MarketDataPoint[]> {
    return this.marketData$.asObservable();
  }

  getSynthesis(): Observable<NormalizedSynthesis> {
    return this.synthesis$;
  }

  getContinuityIndex(): ContinuityIndex {
    return this.continuityIndexSignal();
  }
}
