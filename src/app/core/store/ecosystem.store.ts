import { Injectable, signal, computed } from '@angular/core';

export interface EcosystemState {
  id: string;
  name: string;
  continuityIndex: number; // The proprietary 0-100 score
  load: number; // Current system stress (0-100)
  resilience: number; // Capacity remaining (0-100)
  leadTimeDays: number; // Predicted window (3-14 days)
  status: 'healthy' | 'drift' | 'critical';
}

/**
 * EcosystemStore - Signal-Based Structural Resilience State
 * 
 * Manages the "Structural Resilience State" using Angular Signals.
 * When the ContinuityCore updates the index, the entire dashboard
 * reacts instantly without expensive re-renders.
 */
@Injectable({
  providedIn: 'root'
})
export class EcosystemStore {
  // The primary Signal for the current active ecosystem
  readonly activeEcosystem = signal<EcosystemState | null>(null);

  // All available ecosystems
  readonly allEcosystems = signal<EcosystemState[]>([
    {
      id: 'instance-001',
      name: 'Global Banking System',
      continuityIndex: 85,
      load: 62,
      resilience: 38,
      leadTimeDays: 7,
      status: 'healthy'
    },
    {
      id: 'instance-002',
      name: 'US Credit - Quarterly Review',
      continuityIndex: 72,
      load: 78,
      resilience: 22,
      leadTimeDays: 5,
      status: 'drift'
    }
  ]);

  // Computed signal for the Material 3 "Theme" color based on continuity index
  readonly resilienceStatus = computed(() => {
    const index = this.activeEcosystem()?.continuityIndex ?? 100;
    if (index > 80) return 'healthy';
    if (index > 50) return 'warning';
    return 'critical';
  });

  // Derived lead-time message for the dashboard
  readonly leadTimeMessage = computed(() => {
    const ecosystem = this.activeEcosystem();
    if (!ecosystem) return 'No ecosystem selected';
    const days = ecosystem.leadTimeDays;
    return days >= 10
      ? `${days}-Day Lead Time: Considerable Forecast Window`
      : days >= 3
      ? `${days}-Day Lead Time: Near-Term Stress Predicted`
      : 'System Stable: No Critical Lead Time';
  });

  // Real-time resilience level
  readonly resiliencelevel = computed(() => {
    const ecosystem = this.activeEcosystem();
    if (!ecosystem) return 0;
    return ecosystem.resilience;
  });

  // System stress indicator
  readonly systemStress = computed(() => {
    const ecosystem = this.activeEcosystem();
    if (!ecosystem) return 0;
    return ecosystem.load;
  });

  // Color class for Material 3 theme
  readonly themeColorClass = computed(() => {
    const status = this.resilienceStatus();
    return `resilience-${status}`;
  });

  // Boolean: Is the system approaching critical?
  readonly isApproachingCritical = computed(() => {
    return this.resilienceStatus() !== 'healthy';
  });

  constructor() {
    // Initialize with first ecosystem
    const ecosystems = this.allEcosystems();
    if (ecosystems.length > 0) {
      this.activeEcosystem.set(ecosystems[0]);
    }
  }

  /**
   * Select a different ecosystem as active
   */
  selectEcosystem(id: string): void {
    const ecosystem = this.allEcosystems().find(e => e.id === id);
    if (ecosystem) {
      this.activeEcosystem.set(ecosystem);
    }
  }

  /**
   * Update ecosystem state (from ContinuityCore)
   */
  updateEcosystem(id: string, updates: Partial<EcosystemState>): void {
    const updated = this.allEcosystems().map(e =>
      e.id === id ? { ...e, ...updates } : e
    );
    this.allEcosystems.set(updated);

    // If updating active ecosystem, update it too
    if (this.activeEcosystem()?.id === id) {
      this.activeEcosystem.set({
        ...this.activeEcosystem()!,
        ...updates
      });
    }
  }

  /**
   * Get all ecosystems
   */
  getEcosystems(): EcosystemState[] {
    return this.allEcosystems();
  }

  /**
   * Get active ecosystem
   */
  getActiveEcosystem(): EcosystemState | null {
    return this.activeEcosystem();
  }
}
