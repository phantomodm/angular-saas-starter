import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { LoggingService } from '../services/logging.service';
import { LoggingConfig } from '../models/logging.model';

/**
 * HTTP Interceptor that logs all HTTP requests and responses
 * Captures method, URL, status code, response time, and errors
 */
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  private loggingService = inject(LoggingService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if URL should be excluded from logging
    if (this.shouldExcludeUrl(request.url)) {
      return next.handle(request);
    }

    const startTime = performance.now();
    const requestId = this.generateRequestId();

    // Log outgoing request
    this.loggingService.debug(
      `HTTP ${request.method} ${request.url}`,
      'HTTP',
      {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        requestId,
      },
      ['http', 'request'],
    );

    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        // Log successful response
        if (event.type === 4) {
          // HttpResponse
          const responseTime = performance.now() - startTime;
          this.loggingService.info(
            `HTTP ${request.method} ${request.url} - ${event.status}`,
            'HTTP',
            {
              method: request.method,
              url: request.url,
              status: event.status,
              statusText: event.statusText,
              responseTime: Math.round(responseTime),
              requestId,
            },
            ['http', 'response'],
          );
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const responseTime = performance.now() - startTime;

        // Log error response
        this.loggingService.error(
          `HTTP ${request.method} ${request.url} - ${error.status} ${error.statusText}`,
          'HTTP',
          {
            method: request.method,
            url: request.url,
            status: error.status,
            statusText: error.statusText,
            responseTime: Math.round(responseTime),
            errorMessage: error.message,
            errorUrl: error.url,
            requestId,
          },
          ['http', 'error'],
        );

        // Re-throw error
        return throwError(() => error);
      }),
    );
  }

  /**
   * Check if URL should be excluded from logging
   */
  private shouldExcludeUrl(url: string): boolean {
    // Default exclude patterns
    const excludePatterns = [
      /\.json$/,
      /assets\//,
      /health|ping/,
      /metrics/,
      /logging\.googleapis\.com/, // Don't log logs being sent to GCP
    ];

    return excludePatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sensitiveHeaders = [
      'authorization',
      'x-api-key',
      'api-key',
      'token',
      'cookie',
      'x-csrf-token',
      'x-access-token',
    ];

    const sanitized: Record<string, string> = {};

    // Try to iterate headers if it's a HttpHeaders object
    if (headers && typeof headers.keys === 'function') {
      headers.keys().forEach((key: string) => {
        if (sensitiveHeaders.some((sensitiveHeader) => key.toLowerCase().includes(sensitiveHeader))) {
          sanitized[key] = '***REDACTED***';
        } else {
          sanitized[key] = headers.get(key);
        }
      });
    }

    return sanitized;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `http_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
