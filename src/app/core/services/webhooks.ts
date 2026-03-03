import { Injectable } from '@angular/core';
import { signal, Signal } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { Webhook, WebhookDelivery, WebhookEvent } from '../models/organization.model';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class WebhooksService {
  private mockWebhooks = new Map<string, Webhook>();
  private mockDeliveries = new Map<string, WebhookDelivery>();

  webhooks = signal<Webhook[]>([]);
  selectedWebhook = signal<Webhook | null>(null);
  deliveries = signal<WebhookDelivery[]>([]);

  private deliveryId = 0;

  constructor(private logging: LoggingService) {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock webhook 1: Subscription events
    const webhook1: Webhook = {
      id: 'wh_1',
      organizationId: 'org_1',
      name: 'Subscription Updates',
      description: 'Notified on subscription changes',
      url: 'https://example.com/webhooks/subscriptions',
      events: ['subscription.created', 'subscription.updated', 'subscription.canceled'],
      secret: 'wh_secret_1234567890',
      isActive: true,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 5000,
        exponentialBackoff: true,
      },
      metadata: { color: 'blue' },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      createdBy: 'user_1',
      lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      totalDeliveries: 45,
      failedDeliveries: 2,
    };

    // Mock webhook 2: User events
    const webhook2: Webhook = {
      id: 'wh_2',
      organizationId: 'org_1',
      name: 'User Actions',
      description: 'Track user creation and deletion',
      url: 'https://example.com/webhooks/users',
      events: ['user.created', 'user.updated', 'user.deleted'],
      secret: 'wh_secret_0987654321',
      isActive: true,
      retryPolicy: {
        maxRetries: 5,
        retryDelay: 3000,
        exponentialBackoff: true,
      },
      metadata: { color: 'green' },
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      createdBy: 'user_1',
      lastTriggeredAt: new Date(),
      totalDeliveries: 152,
      failedDeliveries: 8,
    };

    // Mock webhook 3: Payment events
    const webhook3: Webhook = {
      id: 'wh_3',
      organizationId: 'org_1',
      name: 'Payment Processing',
      description: 'Handle payment success/failure',
      url: 'https://example.com/webhooks/payments',
      events: ['payment.succeeded', 'payment.failed', 'invoice.paid'],
      secret: 'wh_secret_5555555555',
      isActive: false,
      retryPolicy: {
        maxRetries: 4,
        retryDelay: 10000,
        exponentialBackoff: true,
      },
      metadata: { color: 'red' },
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      createdBy: 'user_1',
      lastTriggeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      totalDeliveries: 89,
      failedDeliveries: 12,
    };

    this.mockWebhooks.set(webhook1.id, webhook1);
    this.mockWebhooks.set(webhook2.id, webhook2);
    this.mockWebhooks.set(webhook3.id, webhook3);

    // Mock deliveries for webhook 1
    const delivery1: WebhookDelivery = {
      id: `wh_del_${++this.deliveryId}`,
      webhookId: 'wh_1',
      organizationId: 'org_1',
      event: 'subscription.created',
      payload: { subscriptionId: 'sub_123', planId: 'plan_pro', status: 'active' },
      url: 'https://example.com/webhooks/subscriptions',
      method: 'POST',
      status: 'success',
      statusCode: 200,
      responseTime: 245,
      retryCount: 0,
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 60 * 1000),
    };

    const delivery2: WebhookDelivery = {
      id: `wh_del_${++this.deliveryId}`,
      webhookId: 'wh_1',
      organizationId: 'org_1',
      event: 'subscription.updated',
      payload: { subscriptionId: 'sub_456', planId: 'plan_enterprise', status: 'active' },
      url: 'https://example.com/webhooks/subscriptions',
      method: 'POST',
      status: 'failed',
      statusCode: 500,
      responseTime: 5000,
      error: 'Internal Server Error',
      retryCount: 2,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    };

    this.mockDeliveries.set(delivery1.id, delivery1);
    this.mockDeliveries.set(delivery2.id, delivery2);

    // Load initial data into signals
    this.webhooks.set(Array.from(this.mockWebhooks.values()));
    this.deliveries.set(Array.from(this.mockDeliveries.values()).slice(0, 50));
  }

  /**
   * Get all webhooks for organization
   */
  getWebhooks(organizationId: string): Observable<Webhook[]> {
    const webhooks = Array.from(this.mockWebhooks.values()).filter(
      (w) => w.organizationId === organizationId
    );
    return of(webhooks).pipe(delay(200));
  }

  /**
   * Get single webhook
   */
  getWebhook(webhookId: string): Observable<Webhook> {
    const webhook = this.mockWebhooks.get(webhookId);
    if (!webhook) {
      return throwError(() => new Error('Webhook not found'));
    }
    return of(webhook).pipe(delay(150));
  }

  /**
   * Create new webhook
   */
  createWebhook(
    organizationId: string,
    data: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt' | 'secret' | 'totalDeliveries' | 'failedDeliveries' | 'createdBy'>
  ): Observable<Webhook> {
    const webhook: Webhook = {
      ...data,
      id: `wh_${Date.now()}`,
      secret: this.generateSecret(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user_1', // Should come from auth
      totalDeliveries: 0,
      failedDeliveries: 0,
    };

    this.mockWebhooks.set(webhook.id, webhook);
    this.webhooks.update((webhooks) => [...webhooks, webhook]);

    this.logging.info('Webhook created', 'ADMIN', {
      webhookId: webhook.id,
      url: webhook.url,
      events: webhook.events,
    });

    return of(webhook).pipe(delay(300));
  }

  /**
   * Update webhook
   */
  updateWebhook(
    webhookId: string,
    data: Partial<Webhook>
  ): Observable<Webhook> {
    const webhook = this.mockWebhooks.get(webhookId);
    if (!webhook) {
      return throwError(() => new Error('Webhook not found'));
    }

    const updated: Webhook = {
      ...webhook,
      ...data,
      updatedAt: new Date(),
      id: webhook.id, // Ensure ID doesn't change
      createdAt: webhook.createdAt,
      createdBy: webhook.createdBy,
    };

    this.mockWebhooks.set(webhookId, updated);
    this.webhooks.update((webhooks) =>
      webhooks.map((w) => (w.id === webhookId ? updated : w))
    );

    this.logging.info('Webhook updated', 'ADMIN', {
      webhookId,
      changes: Object.keys(data),
    });

    return of(updated).pipe(delay(300));
  }

  /**
   * Delete webhook
   */
  deleteWebhook(webhookId: string): Observable<void> {
    if (!this.mockWebhooks.has(webhookId)) {
      return throwError(() => new Error('Webhook not found'));
    }

    this.mockWebhooks.delete(webhookId);
    this.webhooks.update((webhooks) => webhooks.filter((w) => w.id !== webhookId));
    this.mockDeliveries.forEach((delivery) => {
      if (delivery.webhookId === webhookId) {
        this.mockDeliveries.delete(delivery.id);
      }
    });

    this.logging.info('Webhook deleted', 'ADMIN', { webhookId });

    return of(void 0).pipe(delay(300));
  }

  /**
   * Test webhook by sending test event
   */
  testWebhook(webhookId: string): Observable<WebhookDelivery> {
    const webhook = this.mockWebhooks.get(webhookId);
    if (!webhook) {
      return throwError(() => new Error('Webhook not found'));
    }

    const delivery: WebhookDelivery = {
      id: `wh_del_${++this.deliveryId}`,
      webhookId,
      organizationId: webhook.organizationId,
      event: 'subscription.created' as WebhookEvent,
      payload: {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook delivery',
      },
      url: webhook.url,
      method: 'POST',
      status: 'success',
      statusCode: 200,
      responseTime: Math.floor(Math.random() * 1000) + 100,
      retryCount: 0,
      createdAt: new Date(),
      completedAt: new Date(),
    };

    this.mockDeliveries.set(delivery.id, delivery);

    // Update webhook stats
    webhook.lastTriggeredAt = new Date();
    webhook.totalDeliveries++;

    this.logging.info('Webhook test sent', 'ADMIN', {
      webhookId,
      testDeliveryId: delivery.id,
      url: webhook.url,
    });

    return of(delivery).pipe(delay(500));
  }

  /**
   * Get webhook deliveries
   */
  getDeliveries(
    webhookId?: string,
    organizationId?: string,
    status?: 'success' | 'failed' | 'pending' | 'retrying'
  ): Observable<WebhookDelivery[]> {
    let deliveries = Array.from(this.mockDeliveries.values());

    if (webhookId) {
      deliveries = deliveries.filter((d) => d.webhookId === webhookId);
    }
    if (organizationId) {
      deliveries = deliveries.filter((d) => d.organizationId === organizationId);
    }
    if (status) {
      deliveries = deliveries.filter((d) => d.status === status);
    }

    // Sort by creation date (newest first)
    deliveries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return of(deliveries).pipe(delay(200));
  }

  /**
   * Get delivery details
   */
  getDelivery(deliveryId: string): Observable<WebhookDelivery> {
    const delivery = this.mockDeliveries.get(deliveryId);
    if (!delivery) {
      return throwError(() => new Error('Delivery not found'));
    }
    return of(delivery).pipe(delay(150));
  }

  /**
   * Retry failed delivery
   */
  retryDelivery(deliveryId: string): Observable<WebhookDelivery> {
    const delivery = this.mockDeliveries.get(deliveryId);
    if (!delivery) {
      return throwError(() => new Error('Delivery not found'));
    }

    const updated: WebhookDelivery = {
      ...delivery,
      status: 'retrying',
      retryCount: delivery.retryCount + 1,
      nextRetryAt: new Date(Date.now() + 5000),
    };

    this.mockDeliveries.set(deliveryId, updated);
    this.deliveries.update((deliveries) =>
      deliveries.map((d) => (d.id === deliveryId ? updated : d))
    );

    this.logging.info('Webhook delivery retry initiated', 'ADMIN', {
      deliveryId,
      retryCount: updated.retryCount,
    });

    return of(updated).pipe(delay(200));
  }

  /**
   * Get webhook statistics
   */
  getWebhookStats(webhookId?: string): Observable<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    avgResponseTime: number;
  }> {
    let webhooks = Array.from(this.mockWebhooks.values());
    let deliveries = Array.from(this.mockDeliveries.values());

    if (webhookId) {
      webhooks = webhooks.filter((w) => w.id === webhookId);
      deliveries = deliveries.filter((d) => d.webhookId === webhookId);
    }

    const stats = {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter((w) => w.isActive).length,
      totalDeliveries: deliveries.length,
      successfulDeliveries: deliveries.filter((d) => d.status === 'success').length,
      failedDeliveries: deliveries.filter((d) => d.status === 'failed').length,
      avgResponseTime:
        deliveries.length > 0
          ? deliveries.reduce((sum, d) => sum + d.responseTime, 0) / deliveries.length
          : 0,
    };

    return of(stats).pipe(delay(200));
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'wh_secret_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get available webhook events
   */
  getAvailableEvents(): WebhookEvent[] {
    return [
      'user.created',
      'user.updated',
      'user.deleted',
      'team.created',
      'team.updated',
      'team.deleted',
      'member.invited',
      'member.joined',
      'member.removed',
      'subscription.created',
      'subscription.updated',
      'subscription.canceled',
      'payment.succeeded',
      'payment.failed',
      'invoice.created',
      'invoice.paid',
      'api_key.created',
      'api_key.deleted',
    ];
  }
}