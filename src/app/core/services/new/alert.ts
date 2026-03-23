import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AlertLevel = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  timestamp: Date;
  level: AlertLevel;
  title: string;
  message: string;
  category: 'resilience' | 'threshold' | 'anomaly' | 'configuration' | 'system';
  read: boolean;
  ecosystemId: string;
  thresholdValue?: number;
  currentValue?: number;
  forecastValue?: number;
  forecastHorizon?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  // Current active alerts
  private alerts$ = new BehaviorSubject<Alert[]>([
    {
      id: 'alert-001',
      timestamp: new Date(Date.now() - 3600000),
      level: 'warning',
      title: 'Resilience Drift Detected',
      message: 'Global Banking System showing drift from baseline resilience threshold',
      category: 'resilience',
      read: false,
      ecosystemId: 'instance-001',
      thresholdValue: 75,
      currentValue: 68,
      forecastValue: 62,
      forecastHorizon: 24
    },
    {
      id: 'alert-002',
      timestamp: new Date(Date.now() - 7200000),
      level: 'info',
      title: 'Configuration Update',
      message: 'US Credit Markets ecosystem updated successfully',
      category: 'configuration',
      read: true,
      ecosystemId: 'instance-002'
    },
    {
      id: 'alert-003',
      timestamp: new Date(Date.now() - 10800000),
      level: 'critical',
      title: 'Critical Resilience Threshold Breached',
      message: 'Probability of systemic snap increased to 32% - immediate review recommended',
      category: 'threshold',
      read: false,
      ecosystemId: 'instance-001',
      thresholdValue: 30,
      currentValue: 32,
      forecastHorizon: 48
    },
    {
      id: 'alert-004',
      timestamp: new Date(Date.now() - 14400000),
      level: 'warning',
      title: 'Anomaly Detected',
      message: 'Unusual spread behavior in credit markets detected',
      category: 'anomaly',
      read: true,
      ecosystemId: 'instance-002'
    }
  ]);

  // Signals for reactive updates
  unreadCountSignal = signal<number>(2);
  criticalAlertCountSignal = signal<number>(1);
  allAlertsSignal = signal<Alert[]>(this.alerts$.value);

  constructor() {
    // Subscribe to alert changes
    this.alerts$.subscribe(alerts => {
      this.allAlertsSignal.set(alerts);
      this.unreadCountSignal.set(alerts.filter(a => !a.read).length);
      this.criticalAlertCountSignal.set(alerts.filter(a => a.level === 'critical').length);
    });

    // Simulate occasional new alerts
    this.simulateAlerts();
  }

  /**
   * Create a new alert
   */
  createAlert(
    level: AlertLevel,
    title: string,
    message: string,
    category: Alert['category'],
    ecosystemId: string,
    options?: Partial<Alert>
  ): Alert {
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date(),
      level,
      title,
      message,
      category,
      read: false,
      ecosystemId,
      ...options
    };

    const current = this.alerts$.value;
    this.alerts$.next([alert, ...current]);

    // Notify if critical
    if (level === 'critical') {
      this.notifyUser(alert);
    }

    return alert;
  }

  /**
   * Get all alerts
   */
  getAlerts(): Observable<Alert[]> {
    return this.alerts$.asObservable();
  }

  /**
   * Get unread alerts count
   */
  getUnreadCount(): number {
    return this.unreadCountSignal();
  }

  /**
   * Mark alert as read
   */
  markAsRead(alertId: string): void {
    const updated = this.alerts$.value.map(a =>
      a.id === alertId ? { ...a, read: true } : a
    );
    this.alerts$.next(updated);
  }

  /**
   * Mark all alerts as read
   */
  markAllAsRead(): void {
    const updated = this.alerts$.value.map(a => ({ ...a, read: true }));
    this.alerts$.next(updated);
  }

  /**
   * Delete an alert
   */
  deleteAlert(alertId: string): void {
    const updated = this.alerts$.value.filter(a => a.id !== alertId);
    this.alerts$.next(updated);
  }

  /**
   * Get alerts by level
   */
  getAlertsByLevel(level: AlertLevel): Alert[] {
    return this.alerts$.value.filter(a => a.level === level);
  }

  /**
   * Get alerts by ecosystem
   */
  getAlertsByEcosystem(ecosystemId: string): Alert[] {
    return this.alerts$.value.filter(a => a.ecosystemId === ecosystemId);
  }

  /**
   * Get alerts by date range
   */
  getAlertsByDateRange(startDate: Date, endDate: Date): Alert[] {
    return this.alerts$.value.filter(
      a => a.timestamp >= startDate && a.timestamp <= endDate
    );
  }

  /**
   * Risk Threshold Alert - mathematical drift detection
   */
  checkRiskThreshold(
    currentValue: number,
    threshold: number,
    ecosystemId: string,
    metricName: string
  ): boolean {
    if (currentValue > threshold) {
      const severity: AlertLevel = currentValue > threshold * 1.2 ? 'critical' : 'warning';
      
      this.createAlert(
        severity,
        `${metricName} Risk Threshold Alert`,
        `${metricName} has drifted beyond acceptable threshold (${threshold}). Current: ${currentValue.toFixed(2)}`,
        'threshold',
        ecosystemId,
        {
          thresholdValue: threshold,
          currentValue: currentValue
        }
      );

      return true;
    }
    return false;
  }

  /**
   * Browser notification for critical alerts
   */
  private notifyUser(alert: Alert): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('NHFC Critical Alert', {
        body: alert.title + ': ' + alert.message,
        icon: '/favicon.ico',
        tag: alert.id
      });
    }
  }

  /**
   * Request notification permission
   */
  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  /**
   * Simulate alerts for demonstration
   */
  private simulateAlerts(): void {
    setInterval(() => {
      const random = Math.random();
      if (random > 0.95) {
        this.createAlert(
          'warning',
          'Market Volatility Detected',
          'Increased volatility detected in monitored markets',
          'anomaly',
          'instance-001'
        );
      }
    }, 15000);
  }

  /**
   * Get alert statistics
   */
  getStatistics(): {
    total: number;
    unread: number;
    critical: number;
    warning: number;
    info: number;
  } {
    const alerts = this.alerts$.value;
    return {
      total: alerts.length,
      unread: alerts.filter(a => !a.read).length,
      critical: alerts.filter(a => a.level === 'critical').length,
      warning: alerts.filter(a => a.level === 'warning').length,
      info: alerts.filter(a => a.level === 'info').length
    };
  }
}
