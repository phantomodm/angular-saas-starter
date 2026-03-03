import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * HTTP Error Interceptor
 *
 * Responsibilities:
 * 1. Transform error responses to user-friendly messages
 * 2. Log errors for debugging
 * 3. Handle common HTTP error codes (404, 500, etc)
 * 4. Add error context and metadata
 *
 * Usage in app.config.ts:
 * {
 *   provide: HTTP_INTERCEPTORS,
 *   useClass: ErrorInterceptor,
 *   multi: true
 * }
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);
        const errorContext = {
          status: error.status,
          url: request.url,
          method: request.method,
          timestamp: new Date().toISOString(),
          userMessage: errorMessage,
        };

        // Log error for debugging
        console.error('HTTP Error:', errorContext);

        // Create enhanced error with user-friendly message
        const enhancedError = {
          ...error,
          userMessage: errorMessage,
          context: errorContext,
        };

        return throwError(() => enhancedError);
      }),
    );
  }

  /**
   * Convert HTTP error to user-friendly message
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    // Try to get message from backend error response
    if (error.error?.detail) {
      return error.error.detail;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    // Fallback to HTTP status-based messages
    switch (error.status) {
      case 0:
        return 'Unable to connect to the server. Please check your internet connection.';

      case 400:
        return 'Invalid request. Please check your input and try again.';

      case 401:
        return 'Your session has expired. Please log in again.';

      case 403:
        return 'You do not have permission to perform this action.';

      case 404:
        return 'The requested resource was not found.';

      case 409:
        return 'Conflict with existing data. Please refresh and try again.';

      case 422:
        return 'The provided data is invalid. Please check your input.';

      case 429:
        return 'Too many requests. Please wait a moment and try again.';

      case 500:
        return 'Server error. Please try again later.';

      case 502:
        return 'Service temporarily unavailable. Please try again later.';

      case 503:
        return 'Service is under maintenance. Please try again later.';

      default:
        if (error.status >= 500) {
          return 'Server error. Please try again later.';
        } else if (error.status >= 400) {
          return 'Request failed. Please try again.';
        }
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
