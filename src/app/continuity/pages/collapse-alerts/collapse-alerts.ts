import { Component, inject } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { CollapseDetectorService } from '../../../core/services/collapse-detector.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collapse-alerts',
  imports: [CommonModule, MatCardModule],
  templateUrl: './collapse-alerts.html',
  styles: ``,
})
export class CollapseAlerts {
  det = inject(CollapseDetectorService);

  // This will be called when the user clicks an alert
  jumpTo(ts: string) {
    const event = new CustomEvent('collapse-jump', {
      detail: { timestamp: ts },
    });
    window.dispatchEvent(event);
  }

}
