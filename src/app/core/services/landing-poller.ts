import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subscription, interval, switchMap, tap } from 'rxjs';
import { EcosystemEngineService } from './ecosystem-engine';

@Injectable({
  providedIn: 'root',
})
export class LandingPoller implements OnDestroy {
  private engine = inject(EcosystemEngineService);
  private pollSubscription?: Subscription;

  /**
   * Starts a long-polling cycle for a specific public ecosystem.
   * Updates the global ecosystemState signal every 5 seconds.
   */
  startPolling(ecosystemId: string) {
    if (this.pollSubscription) this.stopPolling();

    this.pollSubscription = interval(5000)
      .pipe(
        switchMap(() => this.engine.getLatestState(ecosystemId)),
        tap(state => {
          // Update the Signal in the Engine Service
          this.engine.ecosystemState.set(state);
          this.engine.loading.set(false);
        })
      )
      .subscribe({
        error: (err) => console.error('Poller sync failure:', err)
      });
  }

  stopPolling() {
    this.pollSubscription?.unsubscribe();
  }

  ngOnDestroy() {
    this.stopPolling();
  }
}
