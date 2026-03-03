import { Component, Input, OnInit, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NodeState } from '../../../core/models/types';

@Component({
  selector: 'ce-signal-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './signal-cards.html',
  styles: `
    .signal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 16px;
    }

    .signal-card {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-radius: 10px;
    }

    .label {
      font-size: 12px;
      opacity: 0.7;
    }

    .value {
      font-size: 20px;
      font-weight: 600;
    }
  `,
})
export class SignalCardsComponent implements OnInit {
  state = input<any>();
  
  continuity = computed(() => this.state()?.continuity ?? 0);
  trend = computed(() => this.state()?.trend ?? 0);
  acceleration = computed(() => this.state()?.acceleration ?? 0);
  regime = computed(() => this.state()?.regime ?? 'neutral');
  collapseScore = computed(() => this.state()?.collapse_score ?? 0);

  constructor(){
  }
  colorFor(value: number | null) {
    if (value === null) return '#6b7280';
    if (value > 0) return '#16a34a';
    if (value < 0) return '#dc2626';
    console.log(this.state());
    return '#6b7280';
  }

  regimeColor(regime: string) {
    switch (regime) {
      case 'bullish':
        return '#16a34a';
      case 'bearish':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  }
  ngOnInit(): void {
    console.log(this.state());
  }
}
