import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { routes } from './app.routes';
import { AuthAdapter, AUTH_ADAPTER } from './core/auth/auth.adapter';
import { FirebaseAuthService } from './core/auth/providers/firebase-auth.service';
import { AuthInterceptor } from './core/http/auth.interceptor';
import { ErrorInterceptor } from './core/http/error.interceptor';
import { MockAuthService } from './core/auth/providers/mock-auth.service';
//import { GlobalErrorHandler } from './core/services/global-error-handler.service';

Chart.register(...registerables);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(NgChartsModule),

    // Provide the auth adapter with production Firebase implementation
    // {
    //   provide: AUTH_ADAPTER,
    //   useClass: FirebaseAuthService,
    // },
    // {
    //   provide: AuthAdapter,
    //   useClass: FirebaseAuthService,
    // },

    // Register HTTP interceptors (order matters - auth first, then error handling)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
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
