import { computed, effect, Injectable, signal } from '@angular/core';

export interface MomentumState {
  timestamp: string;

  // Level 1
  level1: {
    best_bid: [number, number];
    best_ask: [number, number];
    spread: number;
  };

  // Level 2
  level2: {
    bids: [number, number][];
    asks: [number, number][];
  };
  collapse_probability: number;

  // Trade tape
  trades: {
    price: number;
    qty: number;
    side: 'buy' | 'sell';
  }[];
  volume?: number;          // last interval volume
  buy_volume?: number;      // last interval buy volume
  sell_volume?: number;


  // Momentum metrics
  mid: number;
  continuity: number;
  trend: number;
  acceleration: number;
  margin: number;
  inward_velocity: number;
  scheer_intensity: number;

  // Directional output
  direction: string;
  direction_score: number;

  // Engine metadata
  engine_id: string;
  regime?: string;
}

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private apiUrl = 'ws://localhost:8000/ws/momentum';
  // --- Default symbol list ---
  readonly symbols = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'SOLUSDT',
    'XRPUSDT',
    'SIM'
  ];

  // --- Signals ---
  selectedSymbol = signal<string>('BTCUSDT');
  mode = signal<'replay' | 'live' | 'simulator'>('replay');

  momentum = signal<MomentumState | null>(null);
  history = signal<MomentumState[]>([]);
  private ws?: WebSocket;

  // Derived signal: last direction
  direction = computed(() => this.momentum()?.direction ?? 'neutral');

  // Derived signal: collapse warning
  collapseWarning = computed(() => {
    const s = this.momentum();
    if (!s) return false;
    return s.scheer_intensity > 0.9; // tune threshold as needed
  });

  constructor(){
    effect(() => {
      const symbol = this.selectedSymbol();
      const mode = this.mode();

      this.connect(symbol, mode);
    });

  }

  connect(symbol: string, mode: 'replay' | 'live' | 'simulator' = 'replay') {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    const url = `ws://localhost:8000/ws/momentum?symbol=${symbol}&mode=${mode}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.momentum.set(data);
      // Update history
      const current = this.history();
      const updated = [...current, data];
      // Keep last 5000 entries
      if (updated.length > 5000) updated.shift();
      this.history.set(updated);
    };
    this.ws.onclose = (err) => {
      console.error('Momentum WS error:', err);
    };
    this.ws.onerror = (error) => {
      console.error('Momentum WS error:', error);
    };
  }
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  clearHistory() {
    this.history.set([]);
  }
}
