import { Component, computed, inject } from '@angular/core';
import { SimulatorService } from '../../../../core/services/simulator.service';
import { MatCardModule } from "@angular/material/card";

import {MatProgressBarModule} from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-momentum-overview',
  imports: [MatCardModule, MatProgressBarModule, CommonModule],
  templateUrl: './momentum-overview.html',
  styleUrl: './momentum-overview.css',
})
export class MomentumOverview {
  momentumService = inject(SimulatorService);
  momentum = this.momentumService.momentum;
  direction = this.momentumService.direction;
  collapseWarning = this.momentumService.collapseWarning;

  // Derived values for convenience
  continuity = computed(() => this.momentum()?.continuity ?? 0);
  trend = computed(() => this.momentum()?.trend ?? 0);
  acceleration = computed(() => this.momentum()?.acceleration ?? 0);
  scheerIntensity = computed(() => this.momentum()?.scheer_intensity ?? 0);


}
