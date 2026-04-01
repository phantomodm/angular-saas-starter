import { Component, inject } from '@angular/core';

import { CollapseDetectorService } from '../../../core/services/collapse-detector.service';

@Component({
  selector: 'app-collapse-banner',
  standalone: true,
  imports: [],
  template: `
    @if (det.latestEvent()) {
      <div
        class="p-3 bg-red-900/40 border border-red-600 rounded text-red-300 font-mono text-sm">
        ⚠️ Downturn likely: {{ det.latestEvent().message }}
      </div>
    }
    `
})
export class CollapseBanner {
  det = inject(CollapseDetectorService);
}