import { UpperCasePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { SimulatorService } from '../../../../core/services/simulator.service';

@Component({
  selector: 'app-trade-tape',
  imports: [MatCardModule, MatFormFieldModule, UpperCasePipe],
  templateUrl: './trade-tape.html',
  styleUrl: './trade-tape.scss',
})
export class TradeTape {
  private momentumService = inject(SimulatorService);

  trades = computed(() => {
    const m = this.momentumService.momentum();
    return m?.trades ?? [];
  });
}
