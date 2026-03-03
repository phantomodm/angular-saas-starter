/**
 * Severity levels for logs
 */
export type LogSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

/**
 * Log source - where the log originated from
 */
export type LogSource = 'HTTP' | 'AUTH' | 'PROFILE' | 'ADMIN' | 'THEME' | 'APP' | 'USER' | 'SECURITY';

/**
 * Structured log entry matching Google Cloud Logging format
 */
export interface LogEntry {
  timestamp: string;
  severity: LogSeverity;
  source: LogSource;
  message: string;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  requestId?: string;
  labels?: Record<string, string>;
  metadata?: Record<string, any>;
  stackTrace?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  tags?: string[];
}

/**
 * Log statistics for dashboard
 */
export interface LogStats {
  totalLogs: number;
  logsBy24h: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  criticalCount: number;
  logsPerHour: { hour: string; count: number }[];
  topErrors: { error: string; count: number }[];
  topSources: { source: LogSource; count: number }[];
}

/**
 * HTTP Error details for logging
 */
export interface HttpErrorDetail {
  method: string;
  url: string;
  status: number;
  statusText: string;
  message: string;
  responseTime: number;
}

/**
 * Application Error details for logging
 */
export interface AppErrorDetail {
  message: string;
  stack?: string;
  componentName?: string;
  context?: string;
  severity: LogSeverity;
}

/**
 * Google Cloud Logging request format
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/entries
 */
export interface GcpLogEntry {
  logName: string;
  timestamp: string;
  severity: LogSeverity;
  jsonPayload: {
    message: string;
    userId?: string;
    userEmail?: string;
    sessionId?: string;
    requestId?: string;
    labels?: Record<string, string>;
    metadata?: Record<string, any>;
    [key: string]: any;
  };
  resource: {
    type: string;
    labels: {
      project_id: string;
      [key: string]: string;
    };
  };
  sourceLocation?: {
    file: string;
    line: string;
    function: string;
  };
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  enabled: boolean;
  minSeverity: LogSeverity;
  gcpEnabled: boolean;
  gcpProjectId?: string;
  gcpApiKey?: string;
  maxLocalLogs: number;
  flushInterval: number; // milliseconds
  batchSize: number;
  captureHttpLogs: boolean;
  captureErrorLogs: boolean;
  captureWarningLogs: boolean;
  excludeUrls?: RegExp[];
}

/**
 * Default logging configuration
 */
export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  enabled: true,
  minSeverity: 'INFO',
  gcpEnabled: false,
  maxLocalLogs: 1000,
  flushInterval: 30000, // 30 seconds
  batchSize: 100,
  captureHttpLogs: true,
  captureErrorLogs: true,
  captureWarningLogs: true,
  excludeUrls: [
    /\.json$/, // Don't log JSON file requests
    /assets\//, // Don't log asset requests
    /health|ping/, // Don't log health checks
  ],
};