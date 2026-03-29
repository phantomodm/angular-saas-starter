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
      <div
        class="p-2 rounded text-xs font-mono cursor-pointer hover:bg-gray-700 transition"
        [ngClass]="{
          'bg-yellow-900/40 border border-yellow-600 text-yellow-300':
            evt.severity === 'yellow',
          'bg-orange-900/40 border border-orange-600 text-orange-300':
            evt.severity === 'orange',
          'bg-red-900/40 border border-red-600 text-red-300':
            evt.severity === 'red',
        }"
        (click)="jumpTo(evt.timestamp)"
      >
        <div class="font-semibold">
          {{ evt.timestamp }} — {{ evt.severity | uppercase }} Collapse Risk
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
  det = inject(CollapseDetectorService);  jumpTo(ts: string) {
    const event = new CustomEvent('collapse-jump', {
      detail: { timestamp: ts },
    });
    window.dispatchEvent(event);
  }

}