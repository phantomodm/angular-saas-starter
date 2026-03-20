import { Component, inject } from '@angular/core';
import { SimulatorService } from '../../../../core/services/simulator.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-symbol-selector',
  imports: [
    MatSelectModule,
    MatCardModule,
    MatFormFieldModule
  ],
  templateUrl: './symbol-selector.html',
  styleUrls: ['./symbol-selector.css'],
})
export class SymbolSelector {
  private momentum = inject(SimulatorService);
  symbols = this.momentum.symbols;
  selectedSymbol = this.momentum.selectedSymbol;

  constructor() {}

  onSelect(symbol: string) {
    this.momentum.selectedSymbol.set(symbol);
  }
}
