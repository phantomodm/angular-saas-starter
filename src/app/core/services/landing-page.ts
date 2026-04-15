import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EcosystemEngineService, EcosystemState } from '../../pages/ecosystems/ecosystem-engine';
import { EcosystemTemplate } from '../../pages/ecosystems/ecosystem-library';

@Injectable({
  providedIn: 'root',
})
export class LandingPage {
  private engine = inject(EcosystemEngineService);

  // Signal to store live public ecosystems for the landing page
  publicLiveTemplates = signal<EcosystemTemplate[]>([]);
  publicStates = signal<Record<string, EcosystemState>>({});

  async loadPublicData() {
    // Fetch available templates from the API [cite: 24]
    const templates = await firstValueFrom(this.engine.getTemplates());
    this.publicLiveTemplates.set(templates);

    // Fetch the latest state for each active template instance [cite: 34]
    templates.forEach(async (t) => {
      const state = await firstValueFrom(this.engine.getLatestState(t.id));
      this.publicStates.update(prev => ({ ...prev, [t.id]: state }));
    });
  }
}
