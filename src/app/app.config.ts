import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AuthAdapter, AUTH_ADAPTER } from './core/auth/auth.adapter';
import { MockAuthService } from './core/auth/providers/mock-auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // Provide the auth adapter (use MockAuthService by default, swap for real provider when ready)
    {
      provide: AUTH_ADAPTER,
      useClass: MockAuthService,
    },
    {
      provide: AuthAdapter,
      useClass: MockAuthService,
    },
  ],
};
