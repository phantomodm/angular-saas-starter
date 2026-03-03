/* ============================================================
   CORE TIME SERIES TYPES (Intraday + Historical)
      ============================================================ */

export interface SeriesPoint {
  timestamp: string;
  value: number;
}

export type ContinuitySeries = SeriesPoint[];
export type TrendSeries = SeriesPoint[];
export type AccelerationSeries = SeriesPoint[];

export interface CollapsePoint {
  timestamp: string;
  value: number; // collapse_score
}

export type CollapseSeries = CollapsePoint[];

/* ============================================================
   Scheer Collapse Types
============================================================ */
export interface ScheerCollapseAlert {
  timestamp: string;
  symbol: string;
  node: string;
  margin: number;
  inward_velocity: number;
  acceleration: number;
  regime: string | null;
  lead_time: number | null;
  irreversible: boolean;
  collapse_onset: boolean;
}
export interface ScheerCollapseSeriesPoint {
  timestamp: string;
  margin: number;
  inward_velocity: number;
  acceleration: number;
  lead_time: number | null;
  irreversible: boolean;
  collapse_onset: boolean;
}

export interface CollapseComparisonPoint {
  timestamp: string;
  margin: number;
  existing_collapse: boolean | null;
  scheer_onset: boolean | null;
  scheer_irreversible: boolean | null;
  scheer_lead_time: number | null;
}


/* ============================================================
     REGIME SERIES
============================================================ */

export interface RegimePoint {
  timestamp: string;
  regime: "bullish" | "bearish" | "neutral" | null;
}

export type RegimeSeries = RegimePoint[];
export interface RegimeSeriesPoint {
  timestamp: number;        // Unix ms timestamp
  regime: "bullish" | "bearish" | "neutral" | "volatile";
}
/* ============================================================
     HEATMAP TYPES
          (Matches Heatmap.tsx EXACTLY)
============================================================ */

export interface HeatmapPoint {
  node: string;
  timestamp: string;
  value: number;
}

/* ============================================================
     ALERT TYPES
          (Matches AlertsTable + AccelerationAlerts EXACTLY)
               ============================================================ */

export interface AlertItem {
  id: string;
  node: string;
  timestamp: string;
  title: "Acceleration Spike" | "Trend Reversal" | "Continuity Extreme" | "Regime Flip";
  severity: "High" | "Medium" | "Low";
  description: string;
}

export interface AccelerationAlert {
  node: string;
  timestamp: string;
  acceleration: number;
  trend: number;
  continuity: number;
}



/* ============================================================
     FORECAST TYPES (Intraday)
          ============================================================ */

export interface ForecastPoint {
  timestamp: string;
  value: number;
}

export interface ForecastData {
  symbol: string;
  forecast: ForecastPoint[];
}

/* ============================================================
     HISTORICAL FORECAST TYPES (Daily)
          ============================================================ */


export interface HistoricalForecastPoint {
  day: number;
  timestamp: string;

  continuity_pred: number;
  trend_pred: number;
  acceleration_pred: number;

  collapse_index_pred: number;
  collapse_score_pred: number;

  regime: "bullish" | "bearish" | "neutral";

  trendDirection: "up" | "down" | "flat";
  confidence: number;
}


export interface HistoricalForecastData {
  symbol: string;
  forecast: HistoricalForecastPoint[];
}

/* ============================================================
     NODE STATE
          ============================================================ */

export interface NodeState {
  symbol: string;
  category: string | null;
  timestamp: string | null;
  continuity: number | null;
  trend: number | null;
  acceleration: number | null;
  regime: string | null;
  collapse_score: number | null;
}

/* ============================================================
     WATCHLIST + ADMIN TYPES
          ============================================================ */

export interface WatchlistContinuity {
  symbol: string;
  node: string;
  continuity: number;
  trend: number;
  acceleration: number;
  regime: string;
  timestamp: string;
}

export interface WatchlistItem {
  instrument: string;
  node: string;
  frequency: string;
}

export interface ApiKey {
  id: string;
  key: string;
  displayName: string;
  createdAt: string;
  lastUsed: string | null;
}

export interface ApiKeyUsage {
  endpoint: string;
  timestamp: string;
  count?: number;
}

export interface AdminWatchlistItem {
  id: number;
  symbol: string;
  name: string;
  source: string;
  update_interval_minutes: number;
  is_public: boolean;
}

/* ============================================================
     INGESTION TYPES
          ============================================================ */

export interface IngestionStatus {
  instrument: string;
  last_price: number;
  last_timestamp: number;
  status: string;
}

export interface IngestionLog {
  instrument: string;
  price: number;
  timestamp: number;
  status: string;
}

/* ============================================================
     MISC TYPES
          ============================================================ */

export type RegimeDistribution = Record<string, number>;

export type PortfolioOverview = {
  portfolio_continuity: number;
  portfolio_trend: number;
  portfolio_acceleration: number;
  heatmap: {
    node: string;
    continuity: number;
  }[];
};

export interface RisingFallingItem {
  node: string;
  trend: number;
}

export interface AccelerationSpike {
  node: string;
  acceleration: number;
}

export interface SystemHeat {
  system_heat: number;
}

export interface RegimeHeatmapPoint {
  node: string;
  timestamp: string;
  regime: string;
}

export interface ContinuityHeatmapPoint {
  node: string;
  category: string;
  value: number;
}

export interface CorrelationEdge {
  node_a: string;
  node_b: string;
  correlation: number;
}

export interface AlertRule {
  id: number;
  instrument: string;
  condition: string;
  threshold: number;
  delivery_method: string;
}

export interface NewAlertRule {
  instrument: string;
  condition: string;
  threshold: number;
  delivery_method: string;
}

export interface FeatureContribution {
  timestamp: string;
  feature: string;
  value: number;
}

export interface SandboxResult {
  continuity: number;
  trend: number;
  acceleration: number;
  forecast: any[];
  alerts: any[];
}

export type ApiKeyResponse = { api_key: string; };