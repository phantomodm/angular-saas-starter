import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { CollapseDetectorService } from '../../../core/services/collapse-detector.service';

@Component({
  selector: 'app-collapse-alert-feed',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="p-3 bg-gray-900 border border-gray-700 rounded-xl">
      <h3 class="text-sm font-semibold text-red-400 mb-2">
        Collapse Risk Alerts
      </h3>

      <div class="space-y-2 max-h-64 overflow-y-auto">
        @for (evt of det.collapseEvents(); track evt.timestamp) {
          <div class="p-2 rounded bg-gray-800 text-xs text-gray-300 font-mono">
            <div class="text-red-300 font-semibold">
              {{ evt.timestamp }} — Collapse Risk ↑
            </div>
            <div class="mt-1">
              {{ evt.message }}
            </div>
          </div>
        }
      </div>
    </mat-card>
  `
})
export class CollapseAlertFeed {
  det = inject(CollapseDetectorService);
}