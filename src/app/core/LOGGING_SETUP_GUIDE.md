# Global Logging System Setup Guide

This guide explains how to configure and use the global logging system with Google Cloud Logging integration.

## Overview

The logging system provides:
- **Global Error Handling**: Automatically captures all uncaught errors
- **HTTP Request Logging**: Logs all HTTP requests, responses, and errors
- **Application Logging**: Structured logging for app events
- **Local Storage**: Logs stored locally in browser (localStorage)
- **Google Cloud Logging**: Send logs to GCP Logging (production)
- **Admin Dashboard**: View and filter logs in real-time

## Architecture

```
LoggingService (core service)
├── GlobalErrorHandler (captures uncaught errors)
├── LoggingInterceptor (HTTP logging)
└── LogsViewerComponent (admin dashboard)
```

### Key Components

1. **LoggingService** (`src/app/core/services/logging.service.ts`)
   - Core service managing all logging operations
   - Stores logs locally with configurable limits
   - Sends logs to GCP in batches

2. **GlobalErrorHandler** (`src/app/core/services/global-error.handler.ts`)
   - Implements Angular's ErrorHandler interface
   - Catches all unhandled errors application-wide
   - Logs errors with context and stack traces

3. **LoggingInterceptor** (`src/app/core/interceptors/logging.interceptor.ts`)
   - HTTP interceptor for logging all requests
   - Sanitizes sensitive headers (auth tokens, API keys)
   - Tracks response times and status codes

4. **LogsViewerComponent** (`src/app/domains/admin/pages/logs-viewer.component.ts`)
   - Admin dashboard for viewing logs
   - Filter by severity, source, timestamp, search text
   - Export logs as JSON
   - View detailed log information and stack traces

## Configuration

### Default Environment Configurations

The system comes with pre-configured settings for three environments:

#### Development (`loggingConfigDev`)
- Min Severity: DEBUG (logs everything)
- GCP: Disabled
- Local Storage: 1000 logs max
- Flush Interval: 30 seconds

#### Staging (`loggingConfigStaging`)
- Min Severity: INFO
- GCP: Enabled (requires GCP config)
- Local Storage: 750 logs max
- Flush Interval: 45 seconds

#### Production (`loggingConfigProd`)
- Min Severity: WARNING (only warnings and above)
- GCP: Enabled (requires GCP config)
- Local Storage: 500 logs max
- Flush Interval: 60 seconds

### Custom Configuration

To set a custom configuration:

```typescript
import { LoggingService } from './core/services/logging.service';

constructor(private loggingService: LoggingService) {
  this.loggingService.setConfig({
    minSeverity: 'WARNING',
    gcpEnabled: true,
    gcpProjectId: 'your-project-id',
    gcpApiKey: 'your-api-key',
    maxLocalLogs: 500,
    flushInterval: 60000,
  });
}
```

## Google Cloud Logging Setup

### Prerequisites

1. Google Cloud account with billing enabled
2. Cloud Logging API enabled
3. Service account with Cloud Logging permissions

### Step 1: Create a GCP Project

```bash
gcloud projects create your-project-id --name="Angular App Logging"
gcloud config set project your-project-id
```

### Step 2: Enable Cloud Logging API

```bash
gcloud services enable logging.googleapis.com
```

### Step 3: Create a Service Account

```bash
gcloud iam service-accounts create angular-logging \
  --display-name="Angular Logging Service Account"
```

### Step 4: Grant Roles

```bash
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:angular-logging@your-project-id.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

### Step 5: Create and Download Key

```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=angular-logging@your-project-id.iam.gserviceaccount.com
```

### Step 6: Generate API Key for Web

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create an API Key
3. Restrict it to Cloud Logging API
4. Copy the key

### Step 7: Set Environment Variables

In your `.env` file (create if it doesn't exist):

```env
GCP_PROJECT_ID=your-project-id
GCP_API_KEY=your-api-key-here
NODE_ENV=production
```

For **development**, create `.env.development`:

```env
NODE_ENV=development
```

For **staging**, create `.env.staging`:

```env
GCP_PROJECT_ID=your-staging-project-id
GCP_API_KEY=your-staging-api-key
NODE_ENV=staging
```

### Step 8: Configure in Angular

The configuration is automatically applied based on environment detection. You can also manually set it in `main.ts`:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { LoggingService } from './app/core/services/logging.service';
import { getLoggingConfig, getCurrentEnvironment } from './app/core/config/logging.config';

bootstrapApplication(App, appConfig).then((ref) => {
  const loggingService = ref.injector.get(LoggingService);
  const env = getCurrentEnvironment();
  const config = getLoggingConfig(env);
  loggingService.setConfig(config);
}).catch((err) => console.error(err));
```

## Usage

### Basic Logging in Components/Services

```typescript
import { LoggingService } from './core/services/logging.service';

export class MyComponent {
  constructor(private loggingService: LoggingService) {}

  doSomething() {
    // Info log
    this.loggingService.info('User clicked button', 'APP', {
      buttonId: 'submit-btn'
    }, ['user-action']);

    // Warning log
    this.loggingService.warn('API response slow', 'HTTP', {
      url: '/api/users',
      responseTime: 5000
    });

    // Error log
    this.loggingService.error('Failed to load data', 'PROFILE', {
      userId: '123',
      error: 'Network error'
    });
  }
}
```

### Logging HTTP Requests

The `LoggingInterceptor` automatically logs all HTTP requests:

```typescript
// Automatically logged:
// - Request method and URL
// - Response status and time
// - Errors and status codes
// - Sanitized headers (tokens removed)
```

### Setting User Context

```typescript
constructor(private loggingService: LoggingService, private authStore: AuthStore) {
  const user = this.authStore.currentUser();
  if (user) {
    this.loggingService.setUserContext(user.id, user.email);
  }
}
```

### Handling Errors

Uncaught errors are automatically logged by `GlobalErrorHandler`:

```typescript
// This error is automatically logged
throw new Error('Something went wrong');

// As is this one
try {
  riskyOperation();
} catch (error) {
  // Automatically caught and logged by global handler
  throw error;
}
```

### Filtering Logs

```typescript
// Filter logs
const errorLogs = this.loggingService.filterLogs({
  severity: 'ERROR',
  source: 'HTTP',
  search: 'timeout',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24h
  tags: ['http', 'error']
});
```

### Exporting Logs

```typescript
// Export logs as JSON
const json = this.loggingService.exportLogs();
// Save to file manually or use the admin dashboard

// Export filtered logs
const errorJson = this.loggingService.exportLogs(errorLogs);
```

## Accessing the Logs Viewer

1. Login as an admin user
2. Navigate to: `http://localhost:4200/admin/logs`
3. View live logs with filtering options
4. Export logs as JSON for analysis

## Log Severity Levels

- **DEBUG**: Detailed debug information (development only)
- **INFO**: General informational messages
- **WARNING**: Warning messages that should be reviewed
- **ERROR**: Error conditions
- **CRITICAL**: Critical system failures

## Log Sources

- **HTTP**: HTTP requests and responses
- **AUTH**: Authentication events
- **PROFILE**: User profile operations
- **ADMIN**: Admin operations
- **THEME**: Theme/UI operations
- **APP**: General application events
- **USER**: User-related events
- **SECURITY**: Security-related events

## Monitoring and Alerting

### In GCP Console

1. Go to Cloud Logging → Logs Dashboard
2. Create custom metrics from logs:

```
resource.type="global"
severity="ERROR"
jsonPayload.message=~"Failed.*"
```

3. Create alerts based on metrics:
   - Error rate > 10 per minute
   - Critical errors detected
   - Specific error patterns

### Best Practices

1. **Use Consistent Tags**: Tag logs for easy filtering
2. **Include Context**: Add metadata to understand the situation
3. **Monitor Error Rates**: Set up alerts for increased errors
4. **Regular Review**: Check logs regularly for patterns
5. **Clean Up**: Archive old logs to manage costs
6. **Sensitive Data**: Never log passwords, tokens, or PII

## Troubleshooting

### Logs Not Appearing in GCP

1. Check GCP project ID and API key are correct
2. Verify Cloud Logging API is enabled
3. Check service account has Cloud Logging Writer role
4. Look at browser console for errors

### High Storage Usage

1. Reduce `maxLocalLogs` in configuration
2. Increase `flushInterval` to send logs less frequently
3. Archive old logs from GCP

### Performance Issues

1. Check if logging is too verbose (increase `minSeverity`)
2. Disable logging for non-critical paths
3. Monitor localStorage usage (may affect browser performance)

## API Reference

### LoggingService

```typescript
// Logging methods
debug(message, source?, metadata?, tags?)
info(message, source?, metadata?, tags?)
warn(message, source?, metadata?, tags?)
error(message, source?, metadata?, tags?)
critical(message, source?, metadata?, tags?)
logHttpRequest(method, url, status, responseTime, error?)
logError(error, source?, context?)

// Configuration
setConfig(config: Partial<LoggingConfig>)
setUserContext(userId, userEmail?)

// Data retrieval
getLogs()
filterLogs(options)
clearLogs()

// Export
exportLogs(logs?)
sendToGcp(logs)
```

## Example: Complete Setup

```typescript
// In main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { LoggingService } from './app/core/services/logging.service';
import { getLoggingConfig } from './app/core/config/logging.config';

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    // Configure logging based on environment
    const loggingService = appRef.injector.get(LoggingService);
    const isDev = !NgZone;
    
    loggingService.setConfig({
      minSeverity: isDev ? 'DEBUG' : 'WARNING',
      gcpEnabled: !isDev,
      gcpProjectId: process.env['GCP_PROJECT_ID'],
      gcpApiKey: process.env['GCP_API_KEY'],
    });

    loggingService.info('Application initialized', 'APP');
  })
  .catch((err) => console.error('Bootstrap error:', err));
```

## Support & Resources

- [Google Cloud Logging Documentation](https://cloud.google.com/logging/docs)
- [Cloud Logging REST API](https://cloud.google.com/logging/docs/reference/v2/rest)
- [Angular Error Handling](https://angular.io/guide/error-handling)
- [HTTP Interceptors](https://angular.io/guide/http-client#intercepting-requests-and-responses)
