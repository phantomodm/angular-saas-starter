import { LoggingConfig } from '../models/logging.model';

/**
 * Development environment logging configuration
 */
export const loggingConfigDev: LoggingConfig = {
  enabled: true,
  minSeverity: 'DEBUG',
  gcpEnabled: false,
  maxLocalLogs: 1000,
  flushInterval: 30000, // 30 seconds
  batchSize: 100,
  captureHttpLogs: true,
  captureErrorLogs: true,
  captureWarningLogs: true,
  excludeUrls: [/\.json$/, /assets\//, /health|ping/, /metrics/],
};

/**
 * Production environment logging configuration
 */
export const loggingConfigProd: LoggingConfig = {
  enabled: true,
  minSeverity: 'WARNING', // Only WARNING and above in production
  gcpEnabled: true, // Enable Google Cloud Logging in production
  gcpProjectId: '', // Set via setConfig() with environment variables
  gcpApiKey: '', // Set via setConfig() with environment variables
  maxLocalLogs: 500,
  flushInterval: 60000, // 60 seconds
  batchSize: 50,
  captureHttpLogs: true,
  captureErrorLogs: true,
  captureWarningLogs: true,
  excludeUrls: [
    /\.json$/,
    /assets\//,
    /health|ping/,
    /metrics/,
    /logging\.googleapis\.com/,
  ],
};

/**
 * Staging environment logging configuration
 */
export const loggingConfigStaging: LoggingConfig = {
  enabled: true,
  minSeverity: 'INFO',
  gcpEnabled: true, // Enable Google Cloud Logging in staging
  gcpProjectId: '', // Set via setConfig() with environment variables
  gcpApiKey: '', // Set via setConfig() with environment variables
  maxLocalLogs: 750,
  flushInterval: 45000, // 45 seconds
  batchSize: 75,
  captureHttpLogs: true,
  captureErrorLogs: true,
  captureWarningLogs: true,
  excludeUrls: [/\.json$/, /assets\//, /health|ping/, /metrics/],
};

/**
 * Get logging configuration based on environment
 */
export function getLoggingConfig(environment: 'development' | 'staging' | 'production'): LoggingConfig {
  switch (environment) {
    case 'development':
      return loggingConfigDev;
    case 'staging':
      return loggingConfigStaging;
    case 'production':
      return loggingConfigProd;
    default:
      return loggingConfigDev;
  }
}

/**
 * Get current environment
 */
export function getCurrentEnvironment(): 'development' | 'staging' | 'production' {
  // Check if we're in development via Angular's ngDevMode
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    return 'development';
  }

  // Check domain
  if (typeof location !== 'undefined') {
    const host = location.hostname;

    if (host.includes('staging') || host.includes('stage')) {
      return 'staging';
    }

    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('dev')) {
      return 'development';
    }
  }

  return 'production';
}
