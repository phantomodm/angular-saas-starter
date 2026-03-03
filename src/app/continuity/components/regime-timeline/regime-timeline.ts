import { Component, Input, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule, MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'ce-regime-timeline',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTooltipModule],
  templateUrl: './regime-timeline.html',
  styleUrls: ['./regime-timeline.scss'],
})
export class RegimeTimeline {
  data = input<any[]>([]);

  // Normalize segments so each regime block is proportional to time
  segments = computed(() => {
    const data = this.data() ?? [];
    if (!this.data().length) return [];

    const min = this.data()[0].timestamp;
    const max = this.data()[this.data().length - 1].timestamp; 
    const total = max - min;

    return this.data().map((p, i) => {
      const next = this.data()[i + 1]?.timestamp ?? max;
      const width = ((next - p.timestamp) / total) * 100;

      return {
        regime: p.regime,
        width: `${width}%`,
        timestamp: p.timestamp,
      };
    });
  });

  colorFor(regime: string) {
    switch (regime) {
      case 'bullish': return '#16a34a';
      case 'bearish': return '#dc2626';
      case 'neutral': return '#6b7280';
      case 'volatile': return '#eab308';
      default: return '#94a3b8';
    }
  }
}