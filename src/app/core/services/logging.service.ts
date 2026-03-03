import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  LogEntry,
  LogSeverity,
  LogSource,
  GcpLogEntry,
  LoggingConfig,
  DEFAULT_LOGGING_CONFIG,
  LogStats,
} from '../models/logging.model';
import { signal, computed } from '@angular/core';
import { BehaviorSubject, filter, debounceTime, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);

  // Configuration
  private config = signal<LoggingConfig>(DEFAULT_LOGGING_CONFIG);

  // Local log storage
  private logs = signal<LogEntry[]>([]);
  private localStorageKey = 'app-logs';
  private sessionId = this.generateSessionId();
  private requestIdCounter = 0;

  // Flush mechanism
  private flush$ = new Subject<LogEntry[]>();
  private flushTimer: any;

  // User context
  private currentUserId = signal<string | undefined>(undefined);
  private currentUserEmail = signal<string | undefined>(undefined);

  // Computed stats
  logsStats = computed(() => {
    const allLogs = this.logs();
    return this.calculateStats(allLogs);
  });

  constructor() {
    this.initializeLogging();
  }

  /**
   * Initialize logging service
   */
  private initializeLogging(): void {
    // Load logs from localStorage
    this.loadLogsFromStorage();

    // Setup auto-flush
    this.setupAutoFlush();

    // Log application start
    this.info('Application started', 'APP', {}, ['startup']);
  }

  /**
   * Set logging configuration
   */
  setConfig(config: Partial<LoggingConfig>): void {
    this.config.update((current) => ({
      ...current,
      ...config,
    }));
  }

  /**
   * Set current user context
   */
  setUserContext(userId: string | undefined, userEmail?: string): void {
    this.currentUserId.set(userId);
    this.currentUserEmail.set(userEmail);
  }

  /**
   * Log debug message
   */
  debug(message: string, source: LogSource = 'APP', metadata?: Record<string, any>, tags?: string[]): void {
    this.log('DEBUG', message, source, metadata, tags);
  }

  /**
   * Log info message
   */
  info(message: string, source: LogSource = 'APP', metadata?: Record<string, any>, tags?: string[]): void {
    this.log('INFO', message, source, metadata, tags);
  }

  /**
   * Log warning message
   */
  warn(message: string, source: LogSource = 'APP', metadata?: Record<string, any>, tags?: string[]): void {
    this.log('WARNING', message, source, metadata, tags);
  }

  /**
   * Log error message
   */
  error(message: string, source: LogSource = 'APP', metadata?: Record<string, any>, tags?: string[]): void {
    this.log('ERROR', message, source, metadata, tags);
  }

  /**
   * Log critical error
   */
  critical(message: string, source: LogSource = 'APP', metadata?: Record<string, any>, tags?: string[]): void {
    this.log('CRITICAL', message, source, metadata, tags);
  }

  /**
   * Log HTTP request
   */
  logHttpRequest(
    method: string,
    url: string,
    status: number,
    responseTime: number,
    error?: string,
  ): void {
    const severity = status >= 400 ? 'ERROR' : 'INFO';

    this.log(
      severity,
      `HTTP ${method} ${url}`,
      'HTTP',
      {
        method,
        url,
        status,
        responseTime,
        ...(error && { error }),
      },
      ['http'],
    );
  }

  /**
   * Log application error with stack trace
   */
  logError(error: Error | string, source: LogSource = 'APP', context?: string): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    this.log(
      'ERROR',
      message,
      source,
      {
        stack,
        context,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
      ['error'],
    );
  }

  /**
   * Get all logs (read-only)
   */
  getLogs(): Readonly<LogEntry[]> {
    return this.logs();
  }

  /**
   * Get logs filtered by criteria
   */
  filterLogs(options: {
    severity?: LogSeverity;
    source?: LogSource;
    userId?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
  }): LogEntry[] {
    const allLogs = this.logs();

    return allLogs.filter((log) => {
      if (options.severity && log.severity !== options.severity) return false;
      if (options.source && log.source !== options.source) return false;
      if (options.userId && log.userId !== options.userId) return false;

      if (options.search) {
        const searchLower = options.search.toLowerCase();
        if (
          !log.message.toLowerCase().includes(searchLower) &&
          !log.stackTrace?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (options.startDate) {
        const logDate = new Date(log.timestamp);
        if (logDate < options.startDate) return false;
      }

      if (options.endDate) {
        const logDate = new Date(log.timestamp);
        if (logDate > options.endDate) return false;
      }

      if (options.tags && options.tags.length > 0) {
        const logTags = log.tags || [];
        const hasTag = options.tags.some((tag) => logTags.includes(tag));
        if (!hasTag) return false;
      }

      return true;
    });
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs.set([]);
    this.clearStorageLogs();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(logs?: LogEntry[]): string {
    const logsToExport = logs || this.logs();
    return JSON.stringify(logsToExport, null, 2);
  }

  /**
   * Send logs to Google Cloud Logging
   */
  sendToGcp(logs: LogEntry[]): void {
    const config = this.config();

    if (!config.gcpEnabled || !config.gcpProjectId || !config.gcpApiKey) {
      console.warn('Google Cloud Logging not configured');
      return;
    }

    // Format logs for GCP
    const gcpEntries = logs.map((log) => this.convertToGcpFormat(log));

    // Send in batches
    const batchSize = config.batchSize;
    for (let i = 0; i < gcpEntries.length; i += batchSize) {
      const batch = gcpEntries.slice(i, i + batchSize);
      this.sendBatchToGcp(batch);
    }
  }

  /**
   * Private methods
   */

  /**
   * Core logging function
   */
  private log(
    severity: LogSeverity,
    message: string,
    source: LogSource,
    metadata?: Record<string, any>,
    tags?: string[],
  ): void {
    const config = this.config();

    // Check if logging is enabled and severity meets threshold
    if (!config.enabled || !this.isSeverityEnabled(severity)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      source,
      message,
      userId: this.currentUserId(),
      userEmail: this.currentUserEmail(),
      sessionId: this.sessionId,
      requestId: this.generateRequestId(),
      metadata,
      tags,
    };

    // Add to local storage
    this.addLog(logEntry);

    // Also console log in development
    if (!this.isProduction()) {
      this.consoleLog(logEntry);
    }

    // Trigger flush if needed
    this.checkAndFlush();
  }

  /**
   * Check if severity level should be logged
   */
  private isSeverityEnabled(severity: LogSeverity): boolean {
    const config = this.config();
    const severityOrder: LogSeverity[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    const minIndex = severityOrder.indexOf(config.minSeverity);
    const currentIndex = severityOrder.indexOf(severity);

    return currentIndex >= minIndex;
  }

  /**
   * Add log to storage
   */
  private addLog(logEntry: LogEntry): void {
    const config = this.config();
    const currentLogs = this.logs();

    // Add new log
    const updatedLogs = [logEntry, ...currentLogs];

    // Keep only max logs
    const trimmedLogs = updatedLogs.slice(0, config.maxLocalLogs);

    this.logs.set(trimmedLogs);
    this.saveLogsToStorage(trimmedLogs);
  }

  /**
   * Check and trigger flush if needed
   */
  private checkAndFlush(): void {
    const config = this.config();
    const logs = this.logs();

    if (logs.length >= config.batchSize) {
      this.flushLogs();
    }
  }

  /**
   * Auto-flush logs periodically
   */
  private setupAutoFlush(): void {
    const config = this.config();

    this.flushTimer = setInterval(() => {
      if (this.logs().length > 0) {
        this.flushLogs();
      }
    }, config.flushInterval);
  }

  /**
   * Flush logs to GCP
   */
  private flushLogs(): void {
    const logs = this.logs();

    if (logs.length === 0) return;

    // Send to GCP if enabled
    if (this.config().gcpEnabled) {
      this.sendToGcp(logs);
    }
  }

  /**
   * Convert log entry to GCP format
   */
  private convertToGcpFormat(log: LogEntry): GcpLogEntry {
    const config = this.config();

    return {
      logName: `projects/${config.gcpProjectId}/logs/angular-app`,
      timestamp: log.timestamp,
      severity: log.severity,
      jsonPayload: {
        message: log.message,
        userId: log.userId,
        userEmail: log.userEmail,
        sessionId: log.sessionId,
        requestId: log.requestId,
        labels: log.labels,
        metadata: log.metadata,
        tags: log.tags,
        stackTrace: log.stackTrace,
        url: log.url,
        method: log.method,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
      },
      resource: {
        type: 'global',
        labels: {
          project_id: config.gcpProjectId || 'unknown',
        },
      },
    };
  }

  /**
   * Send batch to GCP
   */
  private sendBatchToGcp(entries: GcpLogEntry[]): void {
    const config = this.config();

    if (!config.gcpProjectId || !config.gcpApiKey) return;

    const url = `https://logging.googleapis.com/v2/projects/${config.gcpProjectId}/logs:write`;

    this.http
      .post(url, { entries }, { headers: { Authorization: `Bearer ${config.gcpApiKey}` } })
      .subscribe({
        next: () => {
          // Logs sent successfully
        },
        error: (err) => {
          console.error('Failed to send logs to GCP', err);
        },
      });
  }

  /**
   * Save logs to localStorage
   */
  private saveLogsToStorage(logs: LogEntry[]): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to save logs to localStorage', e);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadLogsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        const logs = JSON.parse(stored) as LogEntry[];
        this.logs.set(logs);
      }
    } catch (e) {
      console.warn('Failed to load logs from localStorage', e);
    }
  }

  /**
   * Clear localStorage logs
   */
  private clearStorageLogs(): void {
    try {
      localStorage.removeItem(this.localStorageKey);
    } catch (e) {
      console.warn('Failed to clear logs from localStorage', e);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${++this.requestIdCounter}`;
  }

  /**
   * Calculate log statistics
   */
  private calculateStats(logs: LogEntry[]): LogStats {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const logs24h = logs.filter((log) => new Date(log.timestamp) > last24h);

    // Count by severity
    const severityCounts = {
      ERROR: logs.filter((l) => l.severity === 'ERROR').length,
      WARNING: logs.filter((l) => l.severity === 'WARNING').length,
      INFO: logs.filter((l) => l.severity === 'INFO').length,
      CRITICAL: logs.filter((l) => l.severity === 'CRITICAL').length,
    };

    // Logs per hour
    const logsPerHour = this.calculateLogsPerHour(logs24h);

    // Top errors
    const topErrors = this.calculateTopErrors(logs);

    // Top sources
    const topSources = this.calculateTopSources(logs);

    return {
      totalLogs: logs.length,
      logsBy24h: logs24h.length,
      errorCount: severityCounts.ERROR,
      warningCount: severityCounts.WARNING,
      infoCount: severityCounts.INFO,
      criticalCount: severityCounts.CRITICAL,
      logsPerHour,
      topErrors,
      topSources,
    };
  }

  /**
   * Calculate logs per hour
   */
  private calculateLogsPerHour(logs: LogEntry[]): { hour: string; count: number }[] {
    const hourMap = new Map<string, number>();

    logs.forEach((log) => {
      const date = new Date(log.timestamp);
      const hour = date.toISOString().substring(0, 13); // YYYY-MM-DDTHH
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    return Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  /**
   * Calculate top errors
   */
  private calculateTopErrors(logs: LogEntry[]): { error: string; count: number }[] {
    const errorMap = new Map<string, number>();

    logs
      .filter((log) => log.severity === 'ERROR' || log.severity === 'CRITICAL')
      .forEach((log) => {
        errorMap.set(log.message, (errorMap.get(log.message) || 0) + 1);
      });

    return Array.from(errorMap.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate top sources
   */
  private calculateTopSources(logs: LogEntry[]): { source: LogSource; count: number }[] {
    const sourceMap = new Map<LogSource, number>();

    logs.forEach((log) => {
      sourceMap.set(log.source, (sourceMap.get(log.source) || 0) + 1);
    });

    return Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Console log for development
   */
  private consoleLog(logEntry: LogEntry): void {
    const style = this.getSeverityStyle(logEntry.severity);
    console.log(
      `%c[${logEntry.severity}] ${logEntry.source}: ${logEntry.message}`,
      style,
      logEntry.metadata || {},
    );
  }

  /**
   * Get console style by severity
   */
  private getSeverityStyle(severity: LogSeverity): string {
    const styles = {
      DEBUG: 'color: #666; font-weight: normal;',
      INFO: 'color: #0066cc; font-weight: normal;',
      WARNING: 'color: #ff9900; font-weight: bold;',
      ERROR: 'color: #cc0000; font-weight: bold;',
      CRITICAL: 'color: #660000; font-weight: bold; background: #ffcccc;',
    };

    return styles[severity];
  }

  /**
   * Check if running in production
   */
  private isProduction(): boolean {
    return !this.isDevelopment();
  }

  /**
   * Check if running in development
   */
  private isDevelopment(): boolean {
    return typeof ngDevMode !== 'undefined' && (!!ngDevMode && typeof ngDevMode === 'object');
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}