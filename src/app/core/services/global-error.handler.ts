import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggingService } from './logging.service';

/**
 * Global error handler that catches all uncaught errors in the application
 * Logs them using the LoggingService and prevents default error behavior
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private loggingService: LoggingService | null = null;

  constructor(private injector: Injector) {
    // Delayed injection to avoid circular dependency
    try {
      this.loggingService = this.injector.get(LoggingService);
    } catch (e) {
      console.error('Failed to initialize GlobalErrorHandler', e);
    }
  }

  /**
   * Handle global errors
   */
  handleError(error: Error | string): void {
    // Log the error
    this.logError(error);

    // Don't rethrow to prevent breaking the application
    // But still log to console for visibility in development
    if (this.isDevelopment()) {
      console.error('Global Error:', error);
    }
  }

  /**
   * Log error with context
   */
  private logError(error: Error | string): void {
    if (!this.loggingService) {
      console.error('LoggingService not initialized', error);
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';

    // Determine error source
    const source = this.determineErrorSource(error);

    // Log with full context
    this.loggingService.logError(error, source);

    // For critical errors (runtime errors), also log as critical
    if (this.isCriticalError(error)) {
      this.loggingService.critical(`Critical Error: ${errorMessage}`, source, {
        stack: errorStack,
        type: errorType,
      });
    }
  }

  /**
   * Determine error source based on error message/type
   */
  private determineErrorSource(
    error: Error | string,
  ): 'AUTH' | 'PROFILE' | 'HTTP' | 'APP' | 'SECURITY' {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('auth') || message.includes('authentication')) return 'AUTH';
    if (message.includes('profile') || message.includes('user')) return 'PROFILE';
    if (message.includes('http') || message.includes('request')) return 'HTTP';
    if (message.includes('security') || message.includes('permission')) return 'SECURITY';

    return 'APP';
  }

  /**
   * Check if error is critical
   */
  private isCriticalError(error: Error | string): boolean {
    if (!(error instanceof Error)) return false;

    // Check for common critical error types
    const criticErrorTypes = ['TypeError', 'RangeError', 'SyntaxError', 'ReferenceError'];

    return (
      criticErrorTypes.includes(error.constructor.name) ||
      error.message.includes('undefined') ||
      error.message.includes('null')
    );
  }

  /**
   * Check if running in development
   */
  private isDevelopment(): boolean {
    return typeof ngDevMode !== 'undefined' && (!!ngDevMode && typeof ngDevMode === 'object');
  }
}
