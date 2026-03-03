import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { LoggingService } from './logging.service';

/**
 * Sentry Error Monitoring Service
 * Integrates with Sentry to capture and monitor errors across the application
 * 
 * Setup:
 * 1. Install: npm install @sentry/angular
 * 2. Get DSN from: https://sentry.io/organizations/your-org/projects/
 * 3. Initialize in main.ts with SentryErrorHandler
 * 4. Configure environment settings
 */

export interface SentryConfig {
  dsn: string; // Data Source Name from Sentry
  environment: 'development' | 'staging' | 'production';
  tracesSampleRate: number; // 0.0 to 1.0
  debug: boolean;
  enabled: boolean;
  releaseVersion: string;
  maxBreadcrumbs: number;
  attachStacktrace: boolean;
}

export interface ErrorEvent {
  id: string;
  message: string;
  stackTrace?: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  timestamp: Date;
  url: string;
  userId?: string;
  tags?: Record<string, string>;
  context?: Record<string, any>;
  breadcrumbs?: Breadcrumb[];
  resolved: boolean;
  sentryEventId?: string;
}

export interface Breadcrumb {
  timestamp: Date;
  message: string;
  category: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, any>;
}

export interface SentryStats {
  totalEvents: number;
  unresolvedEvents: number;
  resolvedEvents: number;
  eventsByLevel: Record<string, number>;
  topErrors: { message: string; count: number }[];
  avgResolutionTime: number;
}

@Injectable({
  providedIn: 'root',
})
export class SentryService {
  private config: SentryConfig | null = null;
  private mockEvents = new Map<string, ErrorEvent>();
  private mockBreadcrumbs: Breadcrumb[] = [];

  isInitialized = signal(false);
  sentryConfig = signal<SentryConfig | null>(null);
  errorEvents = signal<ErrorEvent[]>([]);
  sentryStats = signal<SentryStats | null>(null);

  private eventId = 0;

  constructor(private logging: LoggingService) {
    this.initializeMockData();
  }

  /**
   * Initialize Sentry configuration
   * Should be called early in application lifecycle
   */
  initialize(config: SentryConfig): void {
    this.config = config;
    this.sentryConfig.set(config);
    this.isInitialized.set(true);

    if (config.enabled) {
      this.logging.info('Sentry error monitoring initialized', 'SECURITY', {
        environment: config.environment,
        tracesSampleRate: config.tracesSampleRate,
      });

      // In production, you would initialize the actual Sentry SDK:
      // import * as Sentry from "@sentry/angular";
      // Sentry.init({
      //   dsn: config.dsn,
      //   environment: config.environment,
      //   tracesSampleRate: config.tracesSampleRate,
      //   debug: config.debug,
      // });
    }
  }

  /**
   * Capture an exception and send to Sentry
   */
  captureException(error: Error, context?: Record<string, any>): string {
    if (!this.config?.enabled) {
      return '';
    }

    const eventId = `evt_${++this.eventId}`;
    const event: ErrorEvent = {
      id: eventId,
      message: error.message,
      stackTrace: error.stack,
      level: 'error',
      timestamp: new Date(),
      url: window.location.href,
      tags: {
        'error.type': error.constructor.name,
      },
      context,
      breadcrumbs: [...this.mockBreadcrumbs],
      resolved: false,
      sentryEventId: `sentry_${Date.now()}`,
    };

    this.mockEvents.set(eventId, event);
    this.errorEvents.update((events) => [event, ...events]);

    this.logging.error('Exception captured by Sentry', 'SECURITY', {
      sentryEventId: event.sentryEventId,
      message: error.message,
    });

    return event.sentryEventId || '';
  }

  /**
   * Capture a message and send to Sentry
   */
  captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'): string {
    if (!this.config?.enabled) {
      return '';
    }

    const eventId = `evt_${++this.eventId}`;
    const event: ErrorEvent = {
      id: eventId,
      message,
      level,
      timestamp: new Date(),
      url: window.location.href,
      breadcrumbs: [...this.mockBreadcrumbs],
      resolved: false,
      sentryEventId: `sentry_${Date.now()}`,
    };

    this.mockEvents.set(eventId, event);
    this.errorEvents.update((events) => [event, ...events]);

    return event.sentryEventId || '';
  }

  /**
   * Add breadcrumb for error tracking context
   */
  addBreadcrumb(message: string, category: string, level: string, data?: Record<string, any>): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date(),
      message,
      category,
      level: (level as any) || 'info',
      data,
    };

    this.mockBreadcrumbs.push(breadcrumb);

    // Keep only last 100 breadcrumbs
    if (this.mockBreadcrumbs.length > 100) {
      this.mockBreadcrumbs.shift();
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, email?: string, username?: string): void {
    this.addBreadcrumb(`User context set: ${userId}`, 'auth', 'info', { userId, email, username });
  }

  /**
   * Set custom tags for error categorization
   */
  setTag(key: string, value: string): void {
    this.addBreadcrumb(`Tag set: ${key}=${value}`, 'tagging', 'info');
  }

  /**
   * Get all captured error events
   */
  getErrorEvents(
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug',
    resolved?: boolean
  ): Observable<ErrorEvent[]> {
    let events = Array.from(this.mockEvents.values());

    if (level) {
      events = events.filter((e) => e.level === level);
    }
    if (resolved !== undefined) {
      events = events.filter((e) => e.resolved === resolved);
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return of(events).pipe(delay(200));
  }

  /**
   * Get single error event
   */
  getErrorEvent(eventId: string): Observable<ErrorEvent | null> {
    const event = this.mockEvents.get(eventId) || null;
    return of(event).pipe(delay(150));
  }

  /**
   * Mark error event as resolved
   */
  resolveEvent(eventId: string): Observable<ErrorEvent | null> {
    const event = this.mockEvents.get(eventId);
    if (!event) {
      return of(null).pipe(delay(150));
    }

    const updated = { ...event, resolved: true };
    this.mockEvents.set(eventId, updated);
    this.errorEvents.update((events) =>
      events.map((e) => (e.id === eventId ? updated : e))
    );

    this.logging.info('Error event marked as resolved', 'ADMIN', { eventId });

    return of(updated).pipe(delay(200));
  }

  /**
   * Ignore/dismiss error event
   */
  ignoreEvent(eventId: string): Observable<void> {
    this.mockEvents.delete(eventId);
    this.errorEvents.update((events) => events.filter((e) => e.id !== eventId));

    this.logging.info('Error event ignored', 'ADMIN', { eventId });

    return of(void 0).pipe(delay(200));
  }

  /**
   * Get Sentry statistics
   */
  getStats(): Observable<SentryStats> {
    const events = Array.from(this.mockEvents.values());
    const unresolvedEvents = events.filter((e) => !e.resolved);
    const resolvedEvents = events.filter((e) => e.resolved);

    // Count by level
    const eventsByLevel: Record<string, number> = {
      fatal: 0,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0,
    };
    events.forEach((e) => {
      eventsByLevel[e.level]++;
    });

    // Top errors
    const errorMap = new Map<string, number>();
    events.forEach((e) => {
      errorMap.set(e.message, (errorMap.get(e.message) || 0) + 1);
    });
    const topErrors = Array.from(errorMap.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const stats: SentryStats = {
      totalEvents: events.length,
      unresolvedEvents: unresolvedEvents.length,
      resolvedEvents: resolvedEvents.length,
      eventsByLevel,
      topErrors,
      avgResolutionTime: resolvedEvents.length > 0 ? 3600 * 1000 : 0, // Mock value
    };

    return of(stats).pipe(delay(200));
  }

  /**
   * Get breadcrumb history
   */
  getBreadcrumbs(limit: number = 50): Breadcrumb[] {
    return this.mockBreadcrumbs.slice(-limit);
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.mockBreadcrumbs = [];
  }

  /**
   * Initialize mock data for testing
   */
  private initializeMockData(): void {
    const mockError1: ErrorEvent = {
      id: `evt_${++this.eventId}`,
      message: 'Cannot read property of undefined',
      stackTrace:
        'TypeError: Cannot read property of undefined\n    at myFunction (app.component.ts:42:12)\n    at callFunction (core.js:100:5)',
      level: 'error',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      url: 'https://app.example.com/dashboard',
      tags: { 'error.type': 'TypeError' },
      breadcrumbs: [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          message: 'User navigated to dashboard',
          category: 'navigation',
          level: 'info',
        },
      ],
      resolved: false,
      sentryEventId: 'sentry_error_1',
    };

    const mockError2: ErrorEvent = {
      id: `evt_${++this.eventId}`,
      message: 'HTTP 500 Server Error',
      level: 'warning',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      url: 'https://app.example.com/api/users',
      tags: { 'error.type': 'NetworkError', 'http.status': '500' },
      resolved: true,
      sentryEventId: 'sentry_error_2',
    };

    const mockError3: ErrorEvent = {
      id: `evt_${++this.eventId}`,
      message: 'Form validation failed',
      level: 'warning',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      url: 'https://app.example.com/form',
      tags: { 'error.type': 'ValidationError' },
      resolved: true,
      sentryEventId: 'sentry_error_3',
    };

    this.mockEvents.set(mockError1.id, mockError1);
    this.mockEvents.set(mockError2.id, mockError2);
    this.mockEvents.set(mockError3.id, mockError3);

    this.errorEvents.set(Array.from(this.mockEvents.values()));
  }

  /**
   * Get Sentry configuration for environment
   */
  static getSentryConfigForEnvironment(env: 'development' | 'staging' | 'production'): SentryConfig {
    const baseConfig: SentryConfig = {
      dsn: '', // Set your DSN here or via environment variables
      environment: env,
      releaseVersion: '1.0.0',
      maxBreadcrumbs: 100,
      attachStacktrace: true,
      enabled: env !== 'development',
      debug: env === 'development',
      tracesSampleRate: env === 'production' ? 0.1 : env === 'staging' ? 0.5 : 1.0,
    };

    return baseConfig;
  }
}