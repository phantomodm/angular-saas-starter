import { Component, Input, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ContinuityHeatmapPoint } from '../../../core/models/types';

@Component({
  selector: 'ce-mini-heatmap',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './mini-heatmap.html',
  styles: `
    .heatmap-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-label {
  width: 120px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.cells {
  display: flex;
  gap: 4px;
}

.cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.cell:hover {
  opacity: 0.7;
}
  `,
})
export class MiniHeatmapComponent {
  data = input<ContinuityHeatmapPoint[]>([]);
  // Group by category
  grouped = computed(() => {
    const groups: Record<string, ContinuityHeatmapPoint[]> = {};
    console.log(this.data())
    for (const p of this.data()) {
      const cat = p.node ?? 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }

    // Sort each group by absolute value (top movers)
    for (const key of Object.keys(groups)) {
      groups[key] = groups[key]
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 10); // top 10 movers per category
    }
    console.log(groups);
    return groups;
  });

  colorFor(v: number) {
    const intensity = Math.min(1, Math.pow(Math.abs(v) * 500, 0.7));
  if (v > 0) return `rgba(22,163,74,${intensity})`;
  if (v < 0) return `rgba(220,38,38,${intensity})`;


    
    return 'rgba(148,163,184,0.4)';
  }
}
