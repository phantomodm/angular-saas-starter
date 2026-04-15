import { ResolveFn } from '@angular/router';
import { EcosystemEngineService } from '../../../pages/ecosystems/ecosystem-engine';
import { inject } from '@angular/core';
import { forkJoin, from, switchMap } from 'rxjs';
import { Continuity } from '../continuity';

export const ecosystemResolver: ResolveFn<boolean> = (route, state) => {
  const engine = inject(EcosystemEngineService);
  const continuity = inject(Continuity);
  const id = route.paramMap.get('id');
  if (!id) return false;

  forkJoin({
    ecosystemState: engine.getLatestState(id),
    instruments: engine.getInstanceInstruments(id),
  })
    .pipe(
      switchMap(({ ecosystemState, instruments }) => {
        engine.ecosystemState.set(ecosystemState);
        engine.instruments.set(instruments);

        // Create an object of symbol: state promises, then forkJoin them
        const stateObservables = instruments.reduce(
          (acc, inst) => {
            acc[inst.symbol] = from(
              continuity.getSymbolState(inst.symbol),
            );
            return acc;
          },
          {} as Record<string, any>,
        );

        return forkJoin(stateObservables);
      }),
    )
    .subscribe({
      next: (instrumentStates) => {
        engine.instrumentStates.set(instrumentStates);
        engine.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load ecosystem data:', err);
        engine.loading.set(false);
      },
    });

  return true;
};
