import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  ErrorHandler,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthAdapter, AUTH_ADAPTER } from './core/auth/auth.adapter';
import { MockAuthService } from './core/auth/providers/mock-auth.service';
import { GlobalErrorHandler } from './core/services/global-error.handler';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),

    // Global error handler for logging
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },

    // HTTP interceptor for logging
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,
      multi: true,
    },

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
