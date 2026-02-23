# Sentry Error Monitoring Setup Guide

Sentry is a real-time error tracking platform that helps you identify, fix, and prevent errors in production. This guide walks you through setting up Sentry in your Angular SaaS application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Sentry Project Setup](#sentry-project-setup)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Integration](#integration)
7. [Usage](#usage)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

## Overview

### What is Sentry?

Sentry is an open-source error tracking platform that:
- Captures errors automatically from your application
- Groups similar errors together
- Provides rich context (breadcrumbs, user info, etc.)
- Enables real-time alerts
- Tracks error resolution

### Benefits for SaaS

- **Production Monitoring**: Know about errors before users report them
- **Context**: Understand exactly what led to an error
- **Team Collaboration**: Assign and track error resolution
- **Performance**: Monitor performance issues
- **Compliance**: Full audit trail for enterprise customers

## Prerequisites

- Sentry account (free at https://sentry.io)
- Angular 20.2+ project
- Node.js 18+
- npm or yarn

## Sentry Project Setup

### Step 1: Create Sentry Account

1. Visit https://sentry.io
2. Sign up with email or GitHub
3. Verify your email address

### Step 2: Create Organization

1. After login, create a new organization
2. Name it after your company (e.g., "MyCompany")
3. Set region (US or EU based on location)

### Step 3: Create Angular Project

1. Click "Create Project"
2. Select "Angular" platform
3. Name it (e.g., "SaaS App Frontend")
4. Set alert email (your email)
5. Click "Create Project"

### Step 4: Copy DSN

1. On the project settings page, copy your **DSN** (Data Source Name)
2. It looks like: `https://key@sentry.io/123456`
3. Keep this secret - it identifies your project

## Installation

### Install Sentry SDK

```bash
npm install @sentry/angular @sentry/tracing
```

Or with yarn:

```bash
yarn add @sentry/angular @sentry/tracing
```

### Import in your app

Update `src/main.ts`:

```typescript
import * as Sentry from '@sentry/angular';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

export const environment = {
  production: true,
};

if (environment.production) {
  Sentry.init({
    dsn: 'YOUR_DSN_HERE',
    environment: 'production',
    tracesSampleRate: 0.1, // 10% of transactions
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

const bootstrap = () => bootstrapApplication(AppComponent, appConfig);
export default bootstrap();
```

## Configuration

### Environment Configuration

Create `src/environments/sentry.config.ts`:

```typescript
export const sentryConfig = {
  development: {
    dsn: '',
    enabled: false,
    debug: true,
    tracesSampleRate: 1.0,
  },
  staging: {
    dsn: 'https://your-key@sentry.io/123456',
    enabled: true,
    debug: false,
    tracesSampleRate: 0.5,
  },
  production: {
    dsn: 'https://your-key@sentry.io/123456',
    enabled: true,
    debug: false,
    tracesSampleRate: 0.1,
  },
};
```

### Service Configuration

In `src/app/core/services/sentry.service.ts`:

```typescript
const config = SentryService.getSentryConfigForEnvironment(
  environment.production ? 'production' : 'development'
);
this.sentryService.initialize(config);
```

## Integration

### Global Error Handler

Update `src/app/app.config.ts`:

```typescript
import { GlobalErrorHandler } from './core/services/global-error.handler';
import { SentryService } from './core/services/sentry.service';
import { ErrorHandler } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
      deps: [SentryService, LoggingService],
    },
  ],
};
```

### HTTP Interceptor

The existing `LoggingInterceptor` should also send errors to Sentry:

```typescript
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  constructor(
    private loggingService: LoggingService,
    private sentryService: SentryService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.sentryService.captureException(
          new Error(error.message),
          { status: error.status }
        );
        return throwError(() => error);
      })
    );
  }
}
```

## Usage

### Capture Exceptions

```typescript
import { SentryService } from './core/services/sentry.service';

constructor(private sentryService: SentryService) {}

myMethod() {
  try {
    // your code
  } catch (error) {
    this.sentryService.captureException(
      error as Error,
      { method: 'myMethod', userId: '123' }
    );
  }
}
```

### Capture Messages

```typescript
// Log important events
this.sentryService.captureMessage('Feature flag enabled', 'info');

// Warning level
this.sentryService.captureMessage('High memory usage detected', 'warning');
```

### Add Breadcrumbs

Breadcrumbs provide context about what happened before an error:

```typescript
// User navigation
this.sentryService.addBreadcrumb(
  'User clicked dashboard',
  'user-action',
  'info'
);

// API call
this.sentryService.addBreadcrumb(
  'GET /api/users',
  'http',
  'info',
  { status: 200, duration: 145 }
);

// User action
this.sentryService.addBreadcrumb(
  'Form submitted',
  'ui.click',
  'info',
  { formName: 'profileUpdate' }
);
```

### Set User Context

```typescript
// After user logs in
this.sentryService.setUser(
  userId,
  userEmail,
  username
);

// This user's errors will be tagged
```

### Set Custom Tags

```typescript
// Tag errors by feature
this.sentryService.setTag('feature', 'billing');

// Tag errors by deployment
this.sentryService.setTag('deployment', 'v1.2.3');
```

## Best Practices

### 1. Sample Rates

Set appropriate sampling rates:

```typescript
// Development: capture all errors
development: { tracesSampleRate: 1.0 }

// Staging: capture half
staging: { tracesSampleRate: 0.5 }

// Production: capture 10% to reduce noise
production: { tracesSampleRate: 0.1 }
```

### 2. Environment Filtering

Only enable Sentry in staging/production:

```typescript
if (environment.production || environment.staging) {
  this.sentryService.initialize(config);
}
```

### 3. Sensitive Data

Configure what data is captured:

```typescript
Sentry.init({
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.url?.includes('/password')) {
      return null; // Don't send
    }
    return event;
  },
});
```

### 4. Release Tracking

Tag errors with release version:

```typescript
Sentry.init({
  release: '1.0.0',
  // or from package.json
  release: require('../package.json').version,
});
```

### 5. User Identification

Always set user context when known:

```typescript
// After authentication
Sentry.setUser({
  id: userId,
  email: userEmail,
  username: username,
});

// Before logout
Sentry.setUser(null);
```

## Troubleshooting

### DSN Not Set

**Problem**: "No DSN provided, error reporting disabled"

**Solution**: Add DSN to environment configuration or environment variables

```bash
export SENTRY_DSN="https://your-key@sentry.io/123456"
```

### Too Much Data

**Problem**: Sentry quota exceeded

**Solution**: Reduce sample rates

```typescript
tracesSampleRate: 0.05, // 5% instead of 10%
```

### Test Issue Not Appearing

**Problem**: Test errors don't show in Sentry

**Solution**: 
1. Verify DSN is correct
2. Check network tab for Sentry requests
3. Wait 1-2 minutes (there's usually a delay)
4. Verify project settings allow errors from your domain

### Privacy Concerns

**Problem**: Users concerned about data sending to Sentry

**Solution**:
1. Update privacy policy to mention error monitoring
2. Use data scrubbing to remove sensitive information
3. Use self-hosted Sentry option

## API Reference

### SentryService Methods

#### initialize(config: SentryConfig)

Initialize Sentry with configuration.

```typescript
this.sentryService.initialize({
  dsn: 'https://key@sentry.io/123456',
  environment: 'production',
  tracesSampleRate: 0.1,
  enabled: true,
  releaseVersion: '1.0.0',
  debug: false,
  maxBreadcrumbs: 100,
  attachStacktrace: true,
});
```

#### captureException(error: Error, context?: Record<string, any>)

Capture an exception with optional context.

```typescript
try {
  riskyOperation();
} catch (error) {
  this.sentryService.captureException(
    error as Error,
    { operation: 'riskyOperation', userId: '123' }
  );
}
```

#### captureMessage(message: string, level?: string)

Capture a message (not an error).

```typescript
this.sentryService.captureMessage('User subscription upgraded', 'info');
```

#### addBreadcrumb(message, category, level, data?)

Add context about an action that happened.

```typescript
this.sentryService.addBreadcrumb(
  'User clicked export',
  'ui.click',
  'info',
  { exportFormat: 'csv' }
);
```

#### setUser(userId, email?, username?)

Set the current user for error attribution.

```typescript
this.sentryService.setUser('user_123', 'user@example.com', 'john_doe');
```

#### setTag(key, value)

Add a custom tag for error filtering.

```typescript
this.sentryService.setTag('plan', 'pro');
```

#### getErrorEvents(level?, resolved?)

Retrieve captured errors.

```typescript
this.sentryService.getErrorEvents('error', false).subscribe((events) => {
  console.log('Unresolved errors:', events);
});
```

#### resolveEvent(eventId)

Mark an error as resolved.

```typescript
this.sentryService.resolveEvent(eventId).subscribe(() => {
  console.log('Error marked as resolved');
});
```

#### getStats()

Get error statistics.

```typescript
this.sentryService.getStats().subscribe((stats) => {
  console.log(`${stats.unresolvedEvents} unresolved errors`);
});
```

## Support

For additional help:
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/angular/)
- [Angular Integration Guide](https://docs.sentry.io/platforms/javascript/guides/angular/enriching-events/breadcrumbs/)
- [Community Support](https://discord.gg/Ww9hbqr)
