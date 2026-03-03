import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import {
  NodeState,
  ContinuityHeatmapPoint,
  SeriesPoint,
  TrendSeries,
  ContinuitySeries,
  RegimeSeries,
  AlertItem,
  AccelerationAlert,
  ForecastData,
  WatchlistContinuity,
  IngestionStatus,
  IngestionLog,
  PortfolioOverview,
  ApiKeyResponse,
  ApiKeyUsage,
  SandboxResult,
  CollapseSeries,
  ScheerCollapseSeriesPoint,
  ScheerCollapseAlert,
  CollapseComparisonPoint
} from '../models/types';

const API_BASE_URL = 'https://continuityengine-910896594298.us-central1.run.app';

@Injectable({ providedIn: 'root' })
export class Continuity {
  private http = inject(HttpClient);

  /* -------------------------------------------------------
     INTERNAL SAFE HELPERS (Angular versions)
  ------------------------------------------------------- */

  private async apiGet<T>(path: string): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`GET ${path} failed`);
      return res.json();
    } catch (err) {
      console.error(`GET ${path} failed`, err);
      throw err;
    }
  }

  private async apiPost<T>(path: string, body: any): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`POST ${path} failed`);
      return res.json();
    } catch (err) {
      console.error(`POST ${path} failed`, err);
      throw err;
    }
  }

  private async apiDelete<T>(path: string): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`DELETE ${path} failed`);
      return res.json();
    } catch (err) {
      console.error(`DELETE ${path} failed`, err);
      throw err;
    }
  }

  private async safeFetch<T>(path: string, fallback: T): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`);
      if (!res.ok) {
        console.warn(`API error at ${path}:`, res.status);
        return fallback;
      }

      const data = await res.json();
      return data ?? fallback;
    } catch (err) {
      console.error(`Fetch failed for ${path}:`, err);
      return fallback;
    }
  }

  /* -------------------------------------------------------
     DASHBOARD ROUTES
  ------------------------------------------------------- */

  getNodeTypes() {
    return this.apiGet<string[]>('/dashboard/node-types');
  }

  getNodes(category: string) {
    return this.safeFetch<string[]>(
      `/dashboard/nodes?category=${encodeURIComponent(category)}`,
      []
    );
  }

  getSymbolState(symbol: string) {
    return this.safeFetch<NodeState>(
      `/dashboard/state/${symbol}`,
      {
        symbol,
        continuity: null,
        trend: null,
        acceleration: null,
        regime: null,
        timestamp: null,
        category: null,
        collapse_score: null
      }
    );
  }

  getContinuitySeries(symbol: string) {
    return this.safeFetch<ContinuitySeries>(
      `/dashboard/series/continuity/${symbol}`,
      []
    );
  }

  getTrendSeries(symbol: string) {
    return this.safeFetch<TrendSeries>(
      `/dashboard/series/trend/${symbol}`,
      []
    );
  }

  getAccelerationSeries(symbol: string) {
    return this.safeFetch<SeriesPoint[]>(
      `/dashboard/series/acceleration/${symbol}`,
      []
    );
  }

  getContinuityHeatmap() {
    return this.safeFetch<ContinuityHeatmapPoint[]>(
      `/dashboard/heatmap/continuity`,
      []
    );
  }

  getLatestAlerts() {
    return this.safeFetch<AlertItem[]>(
      `/dashboard/alerts/latest`,
      []
    );
  }

  getAccelerationAlerts() {
    return this.safeFetch<AccelerationAlert[]>(
      `/dashboard/alerts/acceleration`,
      []
    );
  }

  getForecast(symbol: string) {
    return this.safeFetch<ForecastData>(
      `/dashboard/forecast/${symbol}`,
      { symbol, forecast: [] }
    );
  }

  getHistoricalContinuity(symbol: string) {
    return this.safeFetch<ContinuitySeries>(
      `/dashboard/historical/continuity/${symbol}`,
      []
    );
  }

  getHistoricalTrend(symbol: string) {
    return this.safeFetch<TrendSeries>(
      `/dashboard/historical/trend/${symbol}`,
      []
    );
  }

  getHistoricalAcceleration(symbol: string) {
    return this.safeFetch<SeriesPoint[]>(
      `/dashboard/historical/acceleration/${symbol}`,
      []
    );
  }

  getHistoricalRegime(symbol: string) {
    return this.safeFetch<RegimeSeries>(
      `/dashboard/historical/regime/${symbol}`,
      []
    );
  }

  getHistoricalForecast(symbol: string) {
    return this.safeFetch(
      `/dashboard/historical/forecast/${symbol}`,
      []
    );
  }

  /* -------------------------------------------------------
     ENGINE
  ------------------------------------------------------- */
  getEngineNodeState(symbol: string) {
    return this.apiGet(`/engine/state/${symbol}`);
  }

  /* -------------------------------------------------------
     WATCHLIST
  ------------------------------------------------------- */
  getWatchlistContinuity(userId: string) {
    return this.safeFetch<WatchlistContinuity[]>(
      `/dashboard/watchlist/${userId}`,
      []
    );
  }

  /* -------------------------------------------------------
     INGESTION
  ------------------------------------------------------- */
  getIngestionStatus() {
    return this.apiGet<IngestionStatus[]>('/ingest/status');
  }

  getIngestionLogs() {
    return this.apiGet<IngestionLog[]>('/ingest/logs');
  }

  sendPriceSeries(payload: any) {
    return this.apiPost('/ingest/price-series', payload);
  }

  sendTick(payload: any) {
    return this.apiPost('/ingest/tick', payload);
  }

  /* -------------------------------------------------------
     COLLAPSE SERIES
  ------------------------------------------------------- */
  getCollapseSeries(symbol: string) {
    return this.safeFetch<CollapseSeries>(
      `/dashboard/series/collapse/${symbol}`,
      []
    );
  }

  getHistoricalCollapse(symbol: string) {
    return this.safeFetch<CollapseSeries>(
      `/dashboard/historical/collapse/${symbol}`,
      []
    );
  }

  /* -------------------------------------------------------
     PORTFOLIO
  ------------------------------------------------------- */
  getPortfolioOverview() {
    return this.safeFetch<PortfolioOverview>(
      `/portfolio/overview`,
      {
        portfolio_continuity: 0,
        portfolio_trend: 0,
        portfolio_acceleration: 0,
        heatmap: [{ node: '', continuity: 0 }]
      }
    );
  }

  /* -------------------------------------------------------
     API KEYS
  ------------------------------------------------------- */
  createApiKey() {
    return this.apiPost<ApiKeyResponse>('/api/apikeys/create', {});
  }

  revokeApiKey(key: string) {
    return this.apiDelete(`/api/apikeys/revoke/${key}`);
  }

  getApiKeyUsage() {
    return this.apiGet<ApiKeyUsage[]>('/apikeys/usage');
  }

  /* -------------------------------------------------------
     SANDBOX
  ------------------------------------------------------- */
  analyzeSandboxSeries(series: any) {
    return this.apiPost<SandboxResult>('/sandbox/analyze', { series });
  }

  /* -------------------------------------------------------
     SCHEER COLLAPSE
  ------------------------------------------------------- */
  getScheerCollapseSeries(symbol: string, node: string) {
    return this.apiGet<ScheerCollapseSeriesPoint[]>(
      `/collapse/scheer/series?symbol=${symbol}&node=${node}`
    );
  }

  getScheerCollapseAlerts() {
    return this.apiGet<ScheerCollapseAlert[]>(`/collapse/scheer/latest`);
  }

  getScheerCollapseComparison(symbol: string, node: string) {
    return this.apiGet<CollapseComparisonPoint[]>(
      `/collapse/scheer/compare?symbol=${symbol}&node=${node}`
    );
  }

  runScheerCollapse() {
    return this.apiPost(`/collapse/scheer/run`, {});
  }
}
