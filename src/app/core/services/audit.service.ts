import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay, throwError } from 'rxjs';
import { AuditLog } from '../models/organization.model';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private http = inject(HttpClient);
  private logging = inject(LoggingService);
  private mockLogs = new Map<string, AuditLog>();
  private logId = 0;

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock data
   */
  private initializeMockData(): void {
    const logs: AuditLog[] = [
      {
        id: `audit_${++this.logId}`,
        organizationId: 'org_1',
        userId: '1',
        userEmail: 'admin@example.com',
        action: 'login',
        resourceType: 'auth',
        resourceId: 'session_1',
        resourceName: 'Admin Login',
        metadata: { method: 'email', ipAddress: '192.168.1.1' },
        ipAddress: '192.168.1.1',
        status: 'success',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: `audit_${++this.logId}`,
        organizationId: 'org_1',
        userId: '1',
        userEmail: 'admin@example.com',
        action: 'update',
        resourceType: 'user',
        resourceId: '2',
        resourceName: 'developer@example.com',
        changes: {
          before: { role: 'member' },
          after: { role: 'admin' },
        },
        metadata: { reason: 'Promotion to team lead' },
        status: 'success',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        id: `audit_${++this.logId}`,
        organizationId: 'org_1',
        userId: '1',
        userEmail: 'admin@example.com',
        action: 'create',
        resourceType: 'apikey',
        resourceId: 'key_123',
        resourceName: 'Production API Key',
        metadata: { scope: 'read,write' },
        status: 'success',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];

    logs.forEach((log) => {
      this.mockLogs.set(log.id, log);
      this.logId = parseInt(log.id.split('_')[1]) + 1;
    });
  }

  /**
   * Log an action
   */
  logAction(data: Partial<AuditLog>) {
    const log: AuditLog = {
      id: `audit_${++this.logId}`,
      organizationId: data.organizationId || '',
      userId: data.userId || '',
      userEmail: data.userEmail || '',
      action: data.action || '',
      resourceType: data.resourceType || '',
      resourceId: data.resourceId || '',
      resourceName: data.resourceName || '',
      changes: data.changes,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      status: data.status || 'success',
      reason: data.reason,
      createdAt: new Date(),
    };

    this.mockLogs.set(log.id, log);

    // Log to system logging as well
    this.logging.info(`Audit: ${log.action} on ${log.resourceType}`, 'ADMIN', {
      auditId: log.id,
      userId: log.userId,
      resourceId: log.resourceId,
    });

    return of(log).pipe(delay(200));
  }

  /**
   * Get audit logs
   */
  getAuditLogs(
    organizationId: string,
    options?: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    let logs = Array.from(this.mockLogs.values()).filter(
      (log) => log.organizationId === organizationId,
    );

    // Filter
    if (options?.userId) {
      logs = logs.filter((log) => log.userId === options.userId);
    }
    if (options?.action) {
      logs = logs.filter((log) => log.action === options.action);
    }
    if (options?.resourceType) {
      logs = logs.filter((log) => log.resourceType === options.resourceType);
    }
    if (options?.startDate) {
      logs = logs.filter((log) => log.createdAt >= options.startDate!);
    }
    if (options?.endDate) {
      logs = logs.filter((log) => log.createdAt <= options.endDate!);
    }

    // Sort by date descending
    logs = logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const paginated = logs.slice(offset, offset + limit);

    return of({
      data: paginated,
      total: logs.length,
      hasMore: offset + limit < logs.length,
    }).pipe(delay(300));
  }

  /**
   * Get audit log by ID
   */
  getAuditLog(id: string) {
    const log = this.mockLogs.get(id);
    return log ? of(log).pipe(delay(200)) : throwError(() => new Error('Audit log not found'));
  }

  /**
   * Get audit statistics
   */
  getAuditStats(organizationId: string, days: number = 7) {
    const logs = Array.from(this.mockLogs.values()).filter(
      (log) => log.organizationId === organizationId,
    );

    const recentDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter((log) => log.createdAt >= recentDate);

    // Count by action
    const actionCounts: Record<string, number> = {};
    recentLogs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    // Count by user
    const userCounts: Record<string, number> = {};
    recentLogs.forEach((log) => {
      const key = `${log.userEmail}`;
      userCounts[key] = (userCounts[key] || 0) + 1;
    });

    // Count by resource type
    const resourceCounts: Record<string, number> = {};
    recentLogs.forEach((log) => {
      resourceCounts[log.resourceType] = (resourceCounts[log.resourceType] || 0) + 1;
    });

    return of({
      totalLogs: logs.length,
      recentLogs: recentLogs.length,
      successCount: logs.filter((l) => l.status === 'success').length,
      failureCount: logs.filter((l) => l.status === 'failure').length,
      actionCounts,
      userCounts,
      resourceCounts,
    }).pipe(delay(300));
  }

  /**
   * Export audit logs as CSV
   */
  exportAuditLogs(organizationId: string) {
    const logs = Array.from(this.mockLogs.values()).filter(
      (log) => log.organizationId === organizationId,
    );

    const csv =
      'ID,Date,User,Email,Action,Resource Type,Resource ID,Status\n' +
      logs
        .map(
          (log) =>
            `"${log.id}","${log.createdAt.toISOString()}","${log.userId}","${log.userEmail}","${log.action}","${log.resourceType}","${log.resourceId}","${log.status}"`,
        )
        .join('\n');

    return of({ csv }).pipe(delay(300));
  }

  /**
   * Delete old audit logs (compliance: keep for 90 days)
   */
  archiveOldLogs(organizationId: string, daysToKeep: number = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const idsToDelete = Array.from(this.mockLogs.entries())
      .filter(
        ([_, log]) =>
          log.organizationId === organizationId && log.createdAt < cutoffDate,
      )
      .map(([id, _]) => id);

    idsToDelete.forEach((id) => this.mockLogs.delete(id));

    return of({ archivedCount: idsToDelete.length }).pipe(delay(300));
  }
}
