import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { ApiQuota, RateLimitRecord } from '../models/organization.model';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class RateLimitingService {
  private mockQuotas = new Map<string, ApiQuota>();
  private mockRateLimits = new Map<string, RateLimitRecord>();

  quotas = signal<ApiQuota[]>([]);
  rateLimitRecords = signal<RateLimitRecord[]>([]);

  private recordId = 0;
  private quotaId = 0;

  constructor(private logging: LoggingService) {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock quotas for different API keys
    const quota1: ApiQuota = {
      id: `quota_${++this.quotaId}`,
      organizationId: 'org_1',
      apiKeyId: 'key_abc123',
      quotaType: 'requests',
      limit: 1000,
      period: 'hour',
      currentUsage: 342,
      resetAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    const quota2: ApiQuota = {
      id: `quota_${++this.quotaId}`,
      organizationId: 'org_1',
      apiKeyId: 'key_xyz789',
      quotaType: 'requests',
      limit: 10000,
      period: 'day',
      currentUsage: 5230,
      resetAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
      isActive: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    const quota3: ApiQuota = {
      id: `quota_${++this.quotaId}`,
      organizationId: 'org_1',
      apiKeyId: 'key_def456',
      quotaType: 'storage',
      limit: 5000, // MB
      period: 'month',
      currentUsage: 1250,
      resetAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      isActive: true,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    this.mockQuotas.set(quota1.id, quota1);
    this.mockQuotas.set(quota2.id, quota2);
    this.mockQuotas.set(quota3.id, quota3);

    // Mock rate limit records
    const record1: RateLimitRecord = {
      id: `rl_${++this.recordId}`,
      organizationId: 'org_1',
      apiKeyId: 'key_abc123',
      ipAddress: '192.168.1.1',
      endpoint: '/api/v1/users',
      requestCount: 95,
      windowStart: new Date(Date.now() - 60 * 1000),
      windowEnd: new Date(Date.now() + 60 * 1000),
      isBlocked: false,
    };

    const record2: RateLimitRecord = {
      id: `rl_${++this.recordId}`,
      organizationId: 'org_1',
      apiKeyId: 'key_xyz789',
      ipAddress: '10.0.0.5',
      endpoint: '/api/v1/teams',
      requestCount: 850,
      windowStart: new Date(Date.now() - 60 * 60 * 1000),
      windowEnd: new Date(Date.now() + 60 * 60 * 1000),
      isBlocked: true,
      blockReason: 'Rate limit exceeded: 850/800 requests per hour',
    };

    const record3: RateLimitRecord = {
      id: `rl_${++this.recordId}`,
      organizationId: 'org_1',
      ipAddress: '203.0.113.45',
      endpoint: '/api/v1/auth/login',
      requestCount: 15,
      windowStart: new Date(Date.now() - 60 * 1000),
      windowEnd: new Date(Date.now() + 60 * 1000),
      isBlocked: false,
    };

    this.mockRateLimits.set(record1.id, record1);
    this.mockRateLimits.set(record2.id, record2);
    this.mockRateLimits.set(record3.id, record3);

    // Load initial data
    this.quotas.set(Array.from(this.mockQuotas.values()));
    this.rateLimitRecords.set(Array.from(this.mockRateLimits.values()));
  }

  /**
   * Get quotas for API key
   */
  getQuotas(apiKeyId?: string, organizationId?: string): Observable<ApiQuota[]> {
    let quotas = Array.from(this.mockQuotas.values());

    if (apiKeyId) {
      quotas = quotas.filter((q) => q.apiKeyId === apiKeyId);
    }
    if (organizationId) {
      quotas = quotas.filter((q) => q.organizationId === organizationId);
    }

    return of(quotas).pipe(delay(200));
  }

  /**
   * Get single quota
   */
  getQuota(quotaId: string): Observable<ApiQuota> {
    const quota = this.mockQuotas.get(quotaId);
    if (!quota) {
      return throwError(() => new Error('Quota not found'));
    }
    return of(quota).pipe(delay(150));
  }

  /**
   * Create quota for API key
   */
  createQuota(data: Omit<ApiQuota, 'id' | 'createdAt' | 'updatedAt'>): Observable<ApiQuota> {
    const quota: ApiQuota = {
      ...data,
      id: `quota_${++this.quotaId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockQuotas.set(quota.id, quota);
    this.quotas.update((quotas) => [...quotas, quota]);

    this.logging.info('Quota created', 'ADMIN', {
      quotaId: quota.id,
      apiKeyId: quota.apiKeyId,
      limit: quota.limit,
      period: quota.period,
    });

    return of(quota).pipe(delay(300));
  }

  /**
   * Update quota
   */
  updateQuota(quotaId: string, data: Partial<ApiQuota>): Observable<ApiQuota> {
    const quota = this.mockQuotas.get(quotaId);
    if (!quota) {
      return throwError(() => new Error('Quota not found'));
    }

    const updated: ApiQuota = {
      ...quota,
      ...data,
      id: quota.id,
      createdAt: quota.createdAt,
      updatedAt: new Date(),
    };

    this.mockQuotas.set(quotaId, updated);
    this.quotas.update((quotas) =>
      quotas.map((q) => (q.id === quotaId ? updated : q))
    );

    this.logging.info('Quota updated', 'ADMIN', {
      quotaId,
      changes: Object.keys(data),
    });

    return of(updated).pipe(delay(300));
  }

  /**
   * Delete quota
   */
  deleteQuota(quotaId: string): Observable<void> {
    if (!this.mockQuotas.has(quotaId)) {
      return throwError(() => new Error('Quota not found'));
    }

    this.mockQuotas.delete(quotaId);
    this.quotas.update((quotas) => quotas.filter((q) => q.id !== quotaId));

    this.logging.info('Quota deleted', 'ADMIN', { quotaId });

    return of(void 0).pipe(delay(300));
  }

  /**
   * Check if request is within quota
   */
  checkQuota(apiKeyId: string, quotaType: 'requests' | 'storage' | 'bandwidth'): Observable<boolean> {
    const quotas = Array.from(this.mockQuotas.values()).filter(
      (q) => q.apiKeyId === apiKeyId && q.quotaType === quotaType
    );

    if (quotas.length === 0) {
      // No quota set, allow
      return of(true).pipe(delay(50));
    }

    const quota = quotas[0];
    const isWithinQuota = quota.currentUsage < quota.limit && quota.isActive;

    return of(isWithinQuota).pipe(delay(50));
  }

  /**
   * Increment usage for quota
   */
  incrementUsage(
    apiKeyId: string,
    quotaType: 'requests' | 'storage' | 'bandwidth',
    amount: number = 1
  ): Observable<ApiQuota | null> {
    const quotas = Array.from(this.mockQuotas.values()).filter(
      (q) => q.apiKeyId === apiKeyId && q.quotaType === quotaType
    );

    if (quotas.length === 0) {
      return of(null).pipe(delay(50));
    }

    const quota = quotas[0];
    const updated = this.mockQuotas.get(quota.id);
    if (!updated) {
      return of(null).pipe(delay(50));
    }

    updated.currentUsage += amount;
    this.quotas.update((quotas) =>
      quotas.map((q) => (q.id === quota.id ? updated : q))
    );

    return of(updated).pipe(delay(50));
  }

  /**
   * Get rate limit records
   */
  getRateLimitRecords(
    organizationId?: string,
    apiKeyId?: string,
    isBlocked?: boolean
  ): Observable<RateLimitRecord[]> {
    let records = Array.from(this.mockRateLimits.values());

    if (organizationId) {
      records = records.filter((r) => r.organizationId === organizationId);
    }
    if (apiKeyId) {
      records = records.filter((r) => r.apiKeyId === apiKeyId);
    }
    if (isBlocked !== undefined) {
      records = records.filter((r) => r.isBlocked === isBlocked);
    }

    // Sort by creation date (newest first)
    records.sort((a, b) => new Date(b.windowStart).getTime() - new Date(a.windowStart).getTime());

    return of(records).pipe(delay(200));
  }

  /**
   * Create rate limit record (for tracking purposes)
   */
  createRateLimitRecord(data: Omit<RateLimitRecord, 'id'>): Observable<RateLimitRecord> {
    const record: RateLimitRecord = {
      ...data,
      id: `rl_${++this.recordId}`,
    };

    this.mockRateLimits.set(record.id, record);
    this.rateLimitRecords.update((records) => [...records, record]);

    if (record.isBlocked) {
      this.logging.warn('Rate limit exceeded', 'SECURITY', {
        apiKeyId: record.apiKeyId,
        endpoint: record.endpoint,
        requestCount: record.requestCount,
        reason: record.blockReason,
      });
    }

    return of(record).pipe(delay(100));
  }

  /**
   * Check rate limit for endpoint
   */
  checkRateLimit(
    endpoint: string,
    apiKeyId?: string,
    ipAddress?: string,
    maxRequests: number = 100,
    windowSeconds: number = 60
  ): Observable<{ allowed: boolean; remaining: number; retryAfter?: number }> {
    let records = Array.from(this.mockRateLimits.values()).filter((r) => r.endpoint === endpoint);

    if (apiKeyId) {
      records = records.filter((r) => r.apiKeyId === apiKeyId);
    }
    if (ipAddress) {
      records = records.filter((r) => r.ipAddress === ipAddress);
    }

    // Find current window
    const now = new Date();
    const currentRecord = records.find((r) => r.windowStart <= now && r.windowEnd >= now);

    if (!currentRecord) {
      // New window, no requests yet
      return of({ allowed: true, remaining: maxRequests }).pipe(delay(50));
    }

    const allowed = currentRecord.requestCount < maxRequests;
    const remaining = Math.max(0, maxRequests - currentRecord.requestCount);
    const retryAfter = allowed ? undefined : Math.ceil((currentRecord.windowEnd.getTime() - now.getTime()) / 1000);

    return of({ allowed, remaining, retryAfter }).pipe(delay(50));
  }

  /**
   * Get rate limiting statistics
   */
  getRateLimitingStats(): Observable<{
    totalRequests: number;
    blockedRequests: number;
    blockPercentage: number;
    topBlockedEndpoints: { endpoint: string; count: number }[];
    topBlockedApiKeys: { apiKeyId?: string; count: number }[];
  }> {
    const records = Array.from(this.mockRateLimits.values());
    const totalRequests = records.reduce((sum, r) => sum + r.requestCount, 0);
    const blockedRequests = records.filter((r) => r.isBlocked).length;

    // Get top blocked endpoints
    const endpointMap = new Map<string, number>();
    records
      .filter((r) => r.isBlocked)
      .forEach((r) => {
        endpointMap.set(r.endpoint, (endpointMap.get(r.endpoint) || 0) + 1);
      });
    const topBlockedEndpoints = Array.from(endpointMap.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get top blocked API keys
    const keyMap = new Map<string | undefined, number>();
    records
      .filter((r) => r.isBlocked)
      .forEach((r) => {
        keyMap.set(r.apiKeyId, (keyMap.get(r.apiKeyId) || 0) + 1);
      });
    const topBlockedApiKeys = Array.from(keyMap.entries())
      .map(([apiKeyId, count]) => ({ apiKeyId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return of({
      totalRequests,
      blockedRequests,
      blockPercentage: totalRequests > 0 ? Math.round((blockedRequests / totalRequests) * 100) : 0,
      topBlockedEndpoints,
      topBlockedApiKeys,
    }).pipe(delay(200));
  }

  /**
   * Reset quota usage (for new period)
   */
  resetQuotaUsage(quotaId: string): Observable<ApiQuota> {
    const quota = this.mockQuotas.get(quotaId);
    if (!quota) {
      return throwError(() => new Error('Quota not found'));
    }

    const updated: ApiQuota = {
      ...quota,
      currentUsage: 0,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      updatedAt: new Date(),
    };

    this.mockQuotas.set(quotaId, updated);
    this.quotas.update((quotas) =>
      quotas.map((q) => (q.id === quotaId ? updated : q))
    );

    this.logging.info('Quota usage reset', 'ADMIN', { quotaId });

    return of(updated).pipe(delay(200));
  }
}
