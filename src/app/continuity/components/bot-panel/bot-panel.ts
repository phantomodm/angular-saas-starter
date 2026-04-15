import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { SimulatorService } from '../../../core/services/simulator.service';
import { FormBuilder, FormGroup, FormsModule} from '@angular/forms';
import { BotState } from "../../../core/models/sim";
import {CommonModule} from "@angular/common";
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
@Component({
  selector: 'app-bot-panel',
  imports: [CommonModule, MatCardModule, MatDividerModule, MatSlideToggleModule, FormsModule  ],
  standalone: true,
  template: `
    @if(botState){
        <mat-card class="bot-card">
      <mat-card-title>🤖 Auto-Bot (Scheer Momentum)</mat-card-title>
      <mat-divider></mat-divider>
      <mat-slide-toggle
      [(ngModel)]="isChecked"
      (change)="reloadSimulator()"
      >Enable Fibonacci</mat-slide-toggle>
      
      <div class="bot-status-msg" [class]="{'buy-action': botState.last_action.includes('BUY'), 'sell-action': botState.last_action.includes('SELL')}">
        Action: <strong>{{botState.last_action}}</strong>
      </div>

      <div class="account-grid">
        <div class="label">Bot Position</div>
        <div class="value">{{botState.position_size}}</div>

        <div class="label">Realized P&L</div>
        <div class="value" [style.color]="getPnlColor(botState.realized_pnl)">
          {{botState.realized_pnl | number:'1.2-2'}}
        </div>

        <div class="label">Unrealized P&L</div>
        <div class="value" [style.color]="getPnlColor(botState.unrealized_pnl)">
          {{botState.unrealized_pnl | number:'1.2-2'}}
        </div>
      </div>
    </mat-card>
    }
    
  `,
  styles: [`
    .bot-card { background-color: #1e1e1e; color: white; padding: 12px; margin-bottom: 16px; border: 1px solid #444; }
    .bot-status-msg { margin: 12px 0; padding: 8px; background: #2b2b2b; border-radius: 4px; text-align: center; font-size: 0.95rem; }
    .buy-action { border-left: 4px solid lime; }
    .sell-action { border-left: 4px solid red; }
    .account-grid { display: grid; grid-template-columns: 1fr auto; row-gap: 6px; }
    .label { font-size: 0.9rem; opacity: 0.8; }
    .value { font-weight: bold; text-align: right; }
  `]
})
export class BotPanelComponent implements OnInit {
  private simService = inject(SimulatorService);

  botState?: BotState;
  selectedSymbol = computed(() => this.simulatorService.selectedSymbol);
  simulatorService = inject(SimulatorService);
  isChecked = true;
  //isChecked = signal<boolean>(true);

  constructor() {

  }

  ngOnInit(): void {
    // Assuming connectMomentum() is the method you use to connect to /ws/momentum
    this.simulatorService.connectMomentum().subscribe((data: any) => {
      if (data.bot_state) {
        this.botState = data.bot_state;
      }
    });
  }

  reloadSimulator(){

    const body = {
      mode:'simulator',
      symbol: this.selectedSymbol(),
      enable_fibonacci: this.isChecked
    }
    this.simulatorService.reloadSimulator(body);
  }

  getPnlColor(value: number): string {
    return value > 0 ? 'lime' : value < 0 ? 'red' : 'white';
  }
}
