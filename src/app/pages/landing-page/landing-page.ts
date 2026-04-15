import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { PredictiveTimeline } from '../../continuity/components/predictive-timeline/predictive-timeline';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LiveHero } from '../../core/pages/live-hero/live-hero';
import { EcosystemEngineService } from '../ecosystems/ecosystem-engine';
import { LandingPoller } from '../../core/services/landing-poller';
import { EcosystemLibraryService } from '../ecosystems/ecosystem-library';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-landing-page',
  imports: [
    PredictiveTimeline,
    MatIconModule,
    MatProgressBarModule,
    LiveHero,
    DatePipe,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit, OnDestroy {
  private engine = inject(EcosystemEngineService);
  private poller = inject(LandingPoller);
  private library = inject(EcosystemLibraryService);

templates = this.library.templatesSignal;


  loading = signal(false);
  //loading = this.engine.loading;
  ecosystemState = this.engine.ecosystemState;

  ngOnInit() {
    // 1. Set the Public ID for the Landing Page
    const publicId = 'public-g-sib-monitor';
    this.engine.ecosystemId.set(publicId);

    // 2. Fetch Initial State
    this.engine.getLatestState(publicId).subscribe((state) => {
      this.engine.ecosystemState.set(state);
      this.engine.loading.set(false);

      // 3. Start the 5s Poller for Real-time Updates
      this.poller.startPolling(publicId);
    });
  }

  ngOnDestroy() {
    this.poller.stopPolling();
    this.engine.reset(); //
  }
}
