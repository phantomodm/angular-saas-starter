import { Component, computed, inject } from '@angular/core';
import { SimulatorService } from '../../../../core/services/simulator.service';
import { MatCard, MatCardModule } from "@angular/material/card";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-regime-indicator',
  imports: [MatCardModule, MatIconModule, CommonModule],
  templateUrl: './regime-indicator.html',
  styleUrl: './regime-indicator.css',
})
export class RegimeIndicator {
 momentumService = inject(SimulatorService);
 momentum = this.momentumService.momentum;
 regime = computed(() => this.momentum()?.regime ?? 'neutral');

  icon = computed(() => {
    switch (this.regime()) {
      case 'trending_up': return 'trending_up';
      case 'trending_down': return 'trending_down';
      case 'mean_revert': return 'sync';
      case 'high_vol': return 'flash_on';
      case 'collapse': return 'warning';
      default: return 'horizontal_rule';
    }
  });

  color = computed(() => {
    switch (this.regime()) {
      case 'trending_up': return 'text-green-400';
      case 'trending_down': return 'text-purple-400';
      case 'mean_revert': return 'text-blue-400';
      case 'high_vol': return 'text-yellow-400';
      case 'collapse': return 'text-red-500';
      default: return 'text-gray-400';
    }
  });

}
