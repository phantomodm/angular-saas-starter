import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';

import { NgChartsModule } from 'ng2-charts';
//import { ChartConfiguration, ChartType } from 'chart.js';
import { Header } from '../header/header';
import { Continuity } from '../../../core/services/continuity';
//import { TimeSeriesChart } from '../../components/time-series-chart/time-series-chart';
import { AlertsPanel } from '../../components/alerts-panel/alerts-panel';
import { Heatmap } from '../../components/heatmap/heatmap';
import { RegimeTimeline } from '../../components/regime-timeline/regime-timeline';
import { ForecastTable } from '../../components/forecast-table/forecast-table';
import {
  TimeframeAwareComponent,
  TimeRange,
} from '../../base/timeframe-aware.component';
import { TimeframeFilter } from '../../components/timeframe-filter/timeframe-filter';
import { CombinedSeriesChart } from '../../components/combined-series-chart/combined-series-chart';
import { SignalCardsComponent } from '../../components/signal-cards/signal-cards';
import { MiniHeatmapComponent } from '../../components/mini-heatmap/mini-heatmap';
import { ExplanationPanelComponent } from '../../components/explanation-panel/explanation-panel';
import {
  AlertItem,
  ContinuityHeatmapPoint,
  ForecastData,
  NodeState,
  RegimeSeriesPoint,
  SeriesPoint,
} from '../../../core/models/types';
import { aggregateDailyStrictET } from '../../../shared/utilities/helper';
import { MarketDataPoller } from '../../../core/services/marketdata-poller.service';

@Component({
  selector: 'app-overview-page',
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatGridListModule,
    NgChartsModule,
    Header,
    AlertsPanel,
    RegimeTimeline,
    ForecastTable,
    TimeframeFilter,
    CombinedSeriesChart,
    SignalCardsComponent,
    MiniHeatmapComponent,
    RegimeTimeline,
    ForecastTable,
    ExplanationPanelComponent
],
  templateUrl: './overview-page.html',
  styleUrls: ['./overview-page.scss'],
})
export class OverviewPage implements OnInit {
  private continuity = inject(Continuity);
  private poller = inject(MarketDataPoller);

  selectedSymbol = signal<string>('QQQ');
  selectedCategory = signal<string>('Equities');

  // CATEGORY + SYMBOL
  nodeTypes = signal<string[]>([]);
  nodesForCategory = signal<string[]>([]);

  // STATE
  symbolState = signal<any>(null);

  // FULL RAW SERIES (from poller)
  fullMergedMap = signal<Record<number, any>>({})

  // FILTERED SERIES (UI)
  continuitySeries = signal<any[]>([]);
  trendSeries = signal<any[]>([]);
  accelerationSeries = signal<any[]>([]);
  regimeSeries = computed(() => {
    const merged = this.fullMergedMap();
    if (!merged) return [];

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const data =  Object.values(merged)
      .filter((p) => p.timestamp >= weekAgo)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((p) => ({
        timestamp: p.timestamp,
        regime: p.regime,
      }));
    return data;
  });

  // OTHER DATA
  heatmapData = signal<ContinuityHeatmapPoint[]>([]);
  forecastTableData = signal<ForecastData | undefined>(undefined);
  lastUpdated = signal<string>('N/A');

  // WINDOW FILTER
  timeframeFilter = new TimeframeFilter();

  // DATA COMPLETENESS
  dataIncomplete = signal(false);
  missingDays = signal(0);
  expectedDays = signal(0);
  earliestAvailableDate = signal<Date | null>(null);

  constructor() {
    // React to symbol or timeframe changes
    effect(() => {
      // const symbol = this.selectedSymbol();
      // const resolution = this.timeframeFilter.resolution();
      // const window = this.timeframeFilter.window();

      // if (symbol) {
      //   this.loadSymbolData(symbol).then(() => {
      //     this.updateChart();
      //   });
      // }
      // React to poller updates + window changes

      const merged = this.poller.mergedSeries();
      const window = this.timeframeFilter.window();

      if (Object.keys(merged).length > 0) {
        this.fullMergedMap.set(merged);
        console.log(this.fullMergedMap());
        console.log(this.regimeSeries());
        // Extract symbolState from any timestamp
        const firstTs = Object.keys(merged)[0];
        const state = merged[+firstTs].symbolState ?? null;
        this.symbolState.set(state);
        this.updateChart(window);
      }
    });
  }

  async ngOnInit() {
    try {
      // Load categories
      this.nodeTypes.set(await this.continuity.getNodeTypes());
      console.log(this.nodeTypes())
      if (!this.nodeTypes().length) return;

      // Select first category
      //this.selectedCategory.set(this.nodeTypes()[0]);

      // Load symbols for that category
      this.nodesForCategory.set(
        await this.continuity.getNodes(this.selectedCategory()),
      );
      if (!this.nodesForCategory().length) return;

      if (this.selectedCategory() && this.selectedSymbol()) {
        this.poller.setSymbol(this.selectedSymbol());
      } else {
        this.selectedSymbol.set(this.nodesForCategory()[0]);
        this.poller.setSymbol(this.nodesForCategory()[0]);
      }
    } catch (e) {
      console.error('Error loading continuity data:', e);
    }

    this.heatmapData.set(await this.continuity.getContinuityHeatmap());
    console.log(this.heatmapData());
    console.log(this.selectedSymbol());
    this.forecastTableData.set(await this.continuity.getForecast(this.selectedSymbol()));
    console.log(this.forecastTableData());
  }

  // -------------------------------------------------------
  // RESOLUTION HANDLING
  // -------------------------------------------------------
  applyResolution(
    series: { timestamp: number; value: number }[],
    resolution: string,
  ) {
    if (resolution === '1d') {
      // Convert raw 15m candles → daily candles (strict ET)
      return aggregateDailyStrictET(series, 10000);
    }
    return series; // Intraday resolutions use raw data
  }

  // -------------------------------------------------------
  // WINDOW HANDLING
  // -------------------------------------------------------
  // WINDOW LOGIC (trading-day slicing)
  // -------------------------------------------------------
  applyWindow(
    series: { timestamp: number; value?: number; regime?: string }[],
    window: string,
  ) {
    const tradingDays = {
      '1d': 2, // today + yesterday
      '5d': 5,
      '1w': 5,
      '1m': 21,
      '3m': 63,
      '6m': 126,
      '1y': 252,
      '5y': 252 * 5,
      max: Number.MAX_SAFE_INTEGER,
    } as const;

    type WindowKey = keyof typeof tradingDays;
    const isWindowKey = (w: string): w is WindowKey => w in tradingDays;

    const expected = isWindowKey(window)
      ? tradingDays[window]
      : Number.MAX_SAFE_INTEGER;

    this.expectedDays.set(expected);

    const fullCount = series.length;
    const sliced = series.slice(-expected);

    const incomplete = fullCount < expected;
    this.dataIncomplete.set(incomplete);

    if (incomplete && sliced.length > 0) {
      this.missingDays.set(expected - fullCount);
      this.earliestAvailableDate.set(new Date(series[0].timestamp));
    } else {
      this.missingDays.set(0);
      this.earliestAvailableDate.set(null);
    }

    return sliced;
  }

  // -------------------------------------------------------
  // MAIN UPDATE PIPELINE
  // -------------------------------------------------------

  updateChart(window: string) {
    const mergedMap = this.fullMergedMap();
    const timestamps = Object.keys(mergedMap)
      .map(Number)
      .sort((a, b) => a - b);

    const continuity = timestamps.map((ts) => ({
      timestamp: ts,
      value: mergedMap[ts]?.continuity ?? null,
    }));

    const trend = timestamps.map((ts) => ({
      timestamp: ts,
      value: mergedMap[ts]?.trend ?? null,
    }));

    const accel = timestamps.map((ts) => ({
      timestamp: ts,
      value: mergedMap[ts]?.acceleration ?? null,
    }));

    const regime = timestamps.map((ts) => ({
      timestamp: ts,
      regime: mergedMap[ts]?.regime ?? null,
    }));

    // Always aggregate daily first
    const contDaily = aggregateDailyStrictET(continuity, 10000);
    const trendDaily = aggregateDailyStrictET(trend, 10000);
    const accelDaily = aggregateDailyStrictET(accel, 10000);

    // Apply window
    this.continuitySeries.set(this.applyWindow(contDaily, window));
    this.trendSeries.set(this.applyWindow(trendDaily, window));
    this.accelerationSeries.set(this.applyWindow(accelDaily, window));
    //this.regimeSeries.set(this.applyWindow(regime, window));
    this.lastUpdated.set(new Date().toISOString());
  }

  // -------------------------------------------------------
  // LOAD SYMBOL DATA
  // -------------------------------------------------------
  // async loadSymbolData(symbol: string) {
  //   const [
  //     state,
  //     continuityRaw,
  //     trendRaw,
  //     accelerationRaw,
  //     regimeRaw,
  //     heatmap,
  //   ] = await Promise.all([
  //     this.continuity.getSymbolState(symbol),
  //     this.continuity.getContinuitySeries(symbol),
  //     this.continuity.getTrendSeries(symbol),
  //     this.continuity.getAccelerationSeries(symbol),
  //     this.continuity.getHistoricalRegime(symbol),
  //     this.continuity.getContinuityHeatmap(),
  //   ]);
  //   this.symbolState.set(state);

  //   // Normalize raw series → numeric timestamps
  //   this.fullContinuitySeries = continuityRaw.map((p: any) => ({
  //     timestamp: new Date(p.timestamp).getTime(),
  //     value: p.value,
  //   }));

  //   this.fullTrendSeries = trendRaw.map((p: any) => ({
  //     timestamp: new Date(p.timestamp).getTime(),
  //     value: p.value,
  //   }));

  //   this.fullAccelerationSeries = accelerationRaw.map((p: any) => ({
  //     timestamp: new Date(p.timestamp).getTime(),
  //     value: p.value,
  //   }));

  //   this.fullRegimeSeries = regimeRaw.map((p: any) => ({
  //     timestamp: new Date(p.timestamp).getTime(),
  //     regime: p.regime.toLowerCase(),
  //   }));

  //   this.heatmapData = heatmap;
  // }
}
