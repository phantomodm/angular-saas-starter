import { Component, input, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContinuityHeatmapPoint } from '../../../core/models/types';

@Component({
  selector: 'heatmap',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTooltipModule],
  templateUrl: './heatmap.html',
  styleUrls: ['./heatmap.scss'],
})
export class Heatmap {
 data = input<ContinuityHeatmapPoint[]>([]);

  colorFor(v: number) {
    if (v > 0) return 'rgba(22,163,74,0.8)';
    if (v < 0) return 'rgba(220,38,38,0.8)';
    return 'rgba(148,163,184,0.6)';
  }
}
