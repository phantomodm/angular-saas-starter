export interface BotState {
  position_size: number;
  realized_pnl: number;
  unrealized_pnl: number;
  last_action: string;
  last_trade?: {
    price: number;
    side: 'buy' | 'sell';
    time: number; // Unix timestamp
  };
}

export interface MomentumMetrics {
  continuity: number;
  trend: number;
  acceleration: number;
  inward_velocity: number;
  scheer_intensity: number;
  collapse_probability: number;
}

export interface EngineState {
  engine_id: string;
  symbol: string;
  mode: string;
  snapshot: any; // Contains level1, level2, trades, timestamp
  metrics: MomentumMetrics;
  bot_state?: BotState;
}