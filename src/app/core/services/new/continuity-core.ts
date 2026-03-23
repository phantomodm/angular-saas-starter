import { Injectable, signal } from '@angular/core';
import { IngestionService, NormalizedSynthesis, ContinuityIndex } from './ingestion';

export interface ResilienceMetric {
  resilience: number;
  confidence: number;
  timeHorizon: number; // hours
}

/**
 * ContinuityCoreService - "Black Box"
 * 
 * This service takes normalized synthesis data and outputs a resilience metric
 * without exposing the underlying proprietary formula. The calculation is
 * deliberately opaque to maintain competitive advantage.
 */
@Injectable({
  providedIn: 'root'
})
export class ContinuityCoreService {
  private resilienceMetric = signal<ResilienceMetric>({
    resilience: 78,
    confidence: 0.92,
    timeHorizon: 72
  });

  private snapProbability = signal<number>(0.15); // Probability of systemic snap

  constructor(private ingestionService: IngestionService) {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // This would normally subscribe to synthesis data
    // For now, we'll use periodic updates
    setInterval(() => {
      const index = this.ingestionService.getContinuityIndex();
      this.calculateResilienceMetric(index);
    }, 5000);
  }

  /**
   * Black Box calculation - the exact formula is proprietary
   * Input: Continuity Index + Market Synthesis
   * Output: Resilience Metric (opaque calculation)
   */
  private calculateResilienceMetric(index: ContinuityIndex): void {
    // Proprietary multi-factor calculation
    // The exact weights and factors are intentionally hidden
    let resilience = index.score;
    let confidence = 0.85;

    // Adjust based on status
    const statusModifier = {
      'healthy': 1.0,
      'drift': 0.75,
      'critical': 0.5
    }[index.status];

    // Adjust based on trend
    const trendModifier = {
      'improving': 1.1,
      'stable': 1.0,
      'deteriorating': 0.85
    }[index.forecastedTrend];

    resilience = resilience * statusModifier * trendModifier;
    confidence = Math.max(0.5, confidence * statusModifier);

    // Calculate snap probability (inverse of resilience)
    const snapProb = Math.max(0.01, Math.min(0.99, 1 - (resilience / 100)));

    this.resilienceMetric.set({
      resilience: Math.min(100, Math.max(0, resilience)),
      confidence: Math.min(1, Math.max(0, confidence)),
      timeHorizon: 48 + Math.random() * 72 // Forecast horizon
    });

    this.snapProbability.set(snapProb);
  }

  /**
   * Get the resilience metric
   * This is the primary output of the black box
   */
  getResilienceMetric(): ResilienceMetric {
    return this.resilienceMetric();
  }

  /**
   * Get probability of systemic "snap" in the next forecast period
   */
  getSnapProbability(): number {
    return this.snapProbability();
  }

  /**
   * Boolean indicator: Is the system approaching a critical state?
   */
  isApproachingCritical(): boolean {
    return this.snapProbability() > 0.25;
  }

  /**
   * Get resilience level as string for UI
   */
  getResilienceLevel(): 'high' | 'moderate' | 'low' {
    const resilience = this.resilienceMetric().resilience;
    if (resilience > 75) return 'high';
    if (resilience > 50) return 'moderate';
    return 'low';
  }

  /**
   * Generate a synthetic forecast for the next N hours
   */
  generateForecast(hoursAhead: number): { timestamp: Date; resilience: number }[] {
    const forecast = [];
    const startResilience = this.resilienceMetric().resilience;
    
    for (let i = 0; i < hoursAhead; i++) {
      const timestamp = new Date(Date.now() + i * 60 * 60 * 1000);
      // Simple trend-based forecast
      const drift = (Math.random() - 0.5) * 3;
      const resilience = Math.max(0, Math.min(100, startResilience + drift * i));
      
      forecast.push({ timestamp, resilience });
    }
    
    return forecast;
  }
}
