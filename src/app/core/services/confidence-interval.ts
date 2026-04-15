import { computed, inject, Injectable } from '@angular/core';
import { EcosystemEngineService } from '../../pages/ecosystems/ecosystem-engine';

@Injectable({
  providedIn: 'root',
})
export class ConfidenceInterval {
  private engine = inject(EcosystemEngineService);

  // 80% Confidence Interval: Typically +/- 25% of the lead time
  readonly interval80 = computed(() => {
    const base = this.engine.ecosystemState()?.leadTimeDays ?? 12;
    return {
      min: Math.max(1, Math.floor(base * 0.75)), // e.g., 9 days
      max: Math.ceil(base * 1.33)               // e.g., 16 days
    };
  });

  // 95% Confidence Interval: Typically +/- 60% of the lead time
  readonly interval95 = computed(() => {
    const base = this.engine.ecosystemState()?.leadTimeDays ?? 12;
    return {
      min: Math.max(1, Math.floor(base * 0.4)),  // e.g., 5 days
      max: Math.ceil(base * 1.6)                // e.g., 20 days
    };
  });
}
