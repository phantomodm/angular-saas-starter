import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Continuity } from '../../../core/services/continuity';
import { MarketDataPoller } from '../../../core/services/marketdata-poller.service';
import { EcosystemEngineService } from '../../../core/services/ecosystem-engine';

@Component({
  selector: 'app-ecosystem-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  templateUrl: './ecosystem-overview.html',
})
export class EcosystemOverviewComponent implements OnInit , OnDestroy{
  private route = inject(ActivatedRoute);
  private engine = inject(EcosystemEngineService);
  private continuity = inject(Continuity);
  private poller = inject(MarketDataPoller);

  ecosystemId = computed(() => this.engine.ecosystemId());
  ecosystemState = computed(() => this.engine.ecosystemState()  ?? undefined);
  instruments = computed(() => this.engine.instruments());
  instrumentStates = computed(() => this.engine.instrumentStates());

  loading = computed(() => this.engine.loading());

  constructor() {
    effect(() => {
    //   const id = this.ecosystemId();
    //   if (!id) return;

    //   this.loadEcosystemState(id);
    //   this.loadInstruments(id);
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.engine.ecosystemId.set(id);
  }
  
  ngOnDestroy() {
    this.engine.ecosystemId.set('');
  }


  async loadEcosystemState(id: string) {
    this.engine.getLatestState(id).subscribe(state => {
      this.engine.ecosystemState.set(state);
      this.engine.loading.set(false);
    });
  }

  async loadInstruments(id: string) {
    this.engine.getInstanceInstruments(id).subscribe(list => {
      this.engine.instruments.set(list);

      // Load microstructure state for each instrument
      list.forEach(inst => {
        this.continuity.getSymbolState(inst.symbol).then(state => {
          this.engine.instrumentStates.update(prev => ({
            ...prev,
            [inst.symbol]: state
          }));
        });
      });
    });
  }

  getChipClass(status: string) {
    return {
      healthy: 'bg-green-200 text-green-900',
      drift: 'bg-amber-200 text-amber-900',
      critical: 'bg-red-200 text-red-900'
    }[status] || 'bg-gray-200';
  }
}