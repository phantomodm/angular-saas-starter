import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ContinuityHeatmapPoint } from '../../../core/models/types';

@Component({
  selector: 'ce-mini-heatmap',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './mini-heatmap.html',
  styles: `
    .heatmap-card {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .category-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .category-title {
      font-size: 13px;
      font-weight: 600;
      opacity: 0.8;
    }

    .heatmap-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .heatmap-tile {
      width: 90px;
      height: 50px;
      border-radius: 8px;
      padding: 6px;
      display: flex;
      align-items: flex-end;
      color: #f9fafb;
      font-size: 12px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  `,
})
export class MiniHeatmapComponent {
  @Input() data: ContinuityHeatmapPoint[] = [];

  // Group by category
  grouped = computed(() => {
    const groups: Record<string, ContinuityHeatmapPoint[]> = {};

    for (const p of this.data) {
      const cat = p.category ?? 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }

    // Sort each group by absolute value (top movers)
    for (const key of Object.keys(groups)) {
      groups[key] = groups[key]
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 10); // top 10 movers per category
    }

    return groups;
  });

  colorFor(v: number) {
    if (v > 0) return `rgba(22,163,74,${Math.min(1, Math.abs(v) * 20)})`;
    if (v < 0) return `rgba(220,38,38,${Math.min(1, Math.abs(v) * 20)})`;
    return 'rgba(148,163,184,0.4)';
  }
}
