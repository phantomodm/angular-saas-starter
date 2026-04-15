import { Component, computed, inject } from '@angular/core';
import { EcosystemEngineService } from '../../../pages/ecosystems/ecosystem-engine';

@Component({
  selector: 'app-predictive-timeline',
  imports: [],
  templateUrl: './predictive-timeline.html',
  styleUrl: './predictive-timeline.scss',
})
export class PredictiveTimeline {
private engine = inject(EcosystemEngineService);

  // Bind to the live signal from your API [cite: 21, 33]
  state = computed(() => this.engine.ecosystemState());

  // Calculate the 'Snap Point' position (0-100% of the UI width)
  // Maps 0-30 days to 0-100% width
  snapPosition = computed(() => {
    const days = this.state()?.leadTimeDays ?? 12;
    return (days / 30) * 100;
  });

  // 80% Confidence Band (9-16 days)
  band80 = computed(() => ({
    left: ((this.state()?.leadTimeDays ?? 12) * 0.75 / 30) * 100,
    width: ((this.state()?.leadTimeDays ?? 12) * 0.58 / 30) * 100
  }));
}
