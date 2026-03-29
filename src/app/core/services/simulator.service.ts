import { computed, effect, Injectable, signal } from '@angular/core';
import { MomentumMetrics, EngineState, BotState } from '../models/sim';
import { Observable } from 'rxjs';


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
  bot_state?: BotState;
}
const SOCKET_ENDPOINT = 'ws://api.novahuman.ai/ws/momentum';
@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private apiUrl = SOCKET_ENDPOINT;
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
  mode = signal<'replay' | 'live' | 'simulator'>('simulator');

  momentum = signal<MomentumState | null>(null);
  history = signal<MomentumState[]>([]);
  private ws?: WebSocket;
  private momentumWsUrl = SOCKET_ENDPOINT;
  private momentumWs: WebSocket | null = null;

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

  /**
   * Connects to the Momentum Engine WebSocket and returns a continuous Observable stream.
   */
  connectMomentum(mode: string = 'simulator', symbol: string = 'BTCUSDT'): Observable<EngineState> {
    return new Observable<EngineState>((observer) => {
      // Build the URL with query params
      const url = `${this.momentumWsUrl}?mode=${mode}&symbol=${symbol}`;
      this.momentumWs = new WebSocket(url);

      this.momentumWs.onopen = () => {
        console.log(`[TradingService] Connected to Momentum WS (${mode})`);
      };

      this.momentumWs.onmessage = (event) => {
        try {
          const data: EngineState = JSON.parse(event.data);
          observer.next(data);
        } catch (err) {
          console.error('[TradingService] Failed to parse momentum message', err);
        }
      };

      this.momentumWs.onerror = (error) => {
        console.error('[TradingService] WebSocket Error:', error);
        observer.error(error);
      };

      this.momentumWs.onclose = () => {
        console.log('[TradingService] Momentum WS Disconnected');
        observer.complete();
      };

      // Cleanup logic when the Angular component destroys the subscription
      return () => {
        if (this.momentumWs && this.momentumWs.readyState === WebSocket.OPEN) {
          this.momentumWs.close();
        }
      };
    });
  }

  connect(symbol: string, mode: 'replay' | 'live' | 'simulator' = 'replay') {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    const url = `${SOCKET_ENDPOINT}?symbol=${symbol}&mode=${mode}`;
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
