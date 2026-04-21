import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

interface EcosystemSnapshot {
  timestamp: string;
  continuity_index: number;
  trend_index: number;
  acceleration_index: number;
  collapse_risk: number;
  lead_time_days: number;
  status: string;
  raw_metrics: {
    symbols: string[];
    weights: Record<string, number>;
    volatility: Record<string, number>;
  };
}

@Component({
  selector: 'app-ecosystem-state',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ecosystem-state.html',
})
export class EcosystemState implements OnInit {
  private firestore = inject(Firestore);

  loading = signal(true);
  snapshot = signal<EcosystemSnapshot | null>(null);

  workspaceUid = 'demo-workspace'; // Replace with actual workspace context
  instanceId = 'ecosys_12345';     // Replace with actual instance ID

  async ngOnInit() {
    await this.loadSnapshot();
  }

  async loadSnapshot() {
    this.loading.set(true);

    const ref = doc(
      this.firestore,
      `workspaces/${this.workspaceUid}/ecosystem_instances/${this.instanceId}`
    );

    const snap = await getDoc(ref);

    if (snap.exists()) {
      this.snapshot.set(snap.data()['latest_snapshot']);
    }

    this.loading.set(false);
  }

  statusColor(status: string) {
    switch (status) {
      case 'healthy': return 'bg-green-600';
      case 'drift': return 'bg-blue-600';
      case 'stressed': return 'bg-yellow-600';
      case 'critical': return 'bg-orange-600';
      case 'collapse-onset': return 'bg-red-600';
      default: return 'bg-neutral-600';
    }
  }
}
