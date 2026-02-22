import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay, throwError } from 'rxjs';
import {
  BillingSubscription,
  BillingPlan,
  Invoice,
  PaymentMethod,
  UsageMetrics,
} from '../models/organization.model';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private http = inject(HttpClient);
  private logging = inject(LoggingService);
  private mockSubscriptions = new Map<string, BillingSubscription>();
  private mockInvoices = new Map<string, Invoice>();
  private mockPaymentMethods = new Map<string, PaymentMethod>();
  private invoiceId = 0;

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock data
   */
  private initializeMockData(): void {
    // Sample subscription
    const subscription: BillingSubscription = {
      id: 'sub_1',
      organizationId: 'org_1',
      stripeSubscriptionId: 'sub_stripe_123',
      planId: 'plan_pro',
      planName: 'Pro',
      status: 'active',
      currentPeriodStart: new Date('2024-02-01'),
      currentPeriodEnd: new Date('2024-03-01'),
      autoRenew: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
    };
    this.mockSubscriptions.set(subscription.id, subscription);

    // Sample invoices
    const invoices: Invoice[] = [
      {
        id: `inv_${++this.invoiceId}`,
        organizationId: 'org_1',
        stripeInvoiceId: 'inv_stripe_001',
        subscriptionId: 'sub_1',
        amount: 4900,
        currency: 'USD',
        status: 'paid',
        issuedAt: new Date('2024-02-01'),
        dueAt: new Date('2024-02-15'),
        paidAt: new Date('2024-02-02'),
        lineItems: [
          {
            id: 'li_1',
            description: 'Pro Plan - Monthly',
            quantity: 1,
            unitPrice: 4900,
            amount: 4900,
          },
        ],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-02'),
      },
      {
        id: `inv_${++this.invoiceId}`,
        organizationId: 'org_1',
        stripeInvoiceId: 'inv_stripe_002',
        subscriptionId: 'sub_1',
        amount: 4900,
        currency: 'USD',
        status: 'sent',
        issuedAt: new Date('2024-01-01'),
        dueAt: new Date('2024-01-15'),
        paidAt: new Date('2024-01-03'),
        lineItems: [
          {
            id: 'li_2',
            description: 'Pro Plan - Monthly',
            quantity: 1,
            unitPrice: 4900,
            amount: 4900,
          },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-03'),
      },
    ];

    invoices.forEach((inv) => this.mockInvoices.set(inv.id, inv));
    this.invoiceId = invoices.length;

    // Sample payment method
    const paymentMethod: PaymentMethod = {
      id: 'pm_1',
      organizationId: 'org_1',
      stripePaymentMethodId: 'pm_stripe_123',
      type: 'card',
      cardBrand: 'visa',
      cardLast4: '4242',
      cardExpMonth: 12,
      cardExpYear: 2025,
      status: 'active',
      isDefault: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
    };
    this.mockPaymentMethods.set(paymentMethod.id, paymentMethod);
  }

  /**
   * Get subscription
   */
  getSubscription(organizationId: string) {
    const subscription = Array.from(this.mockSubscriptions.values()).find(
      (s) => s.organizationId === organizationId,
    );
    return subscription
      ? of(subscription).pipe(delay(300))
      : throwError(() => new Error('Subscription not found'));
  }

  /**
   * Create subscription
   */
  createSubscription(organizationId: string, planId: string) {
    const subscription: BillingSubscription = {
      id: `sub_${Date.now()}`,
      organizationId,
      planId,
      planName: this.getPlanName(planId),
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockSubscriptions.set(subscription.id, subscription);

    this.logging.info('Subscription created', 'ADMIN', {
      organizationId,
      planId,
      subscriptionId: subscription.id,
    });

    return of(subscription).pipe(delay(300));
  }

  /**
   * Change plan
   */
  changePlan(subscriptionId: string, newPlanId: string, prorationBehavior: string = 'create_prorations') {
    const subscription = this.mockSubscriptions.get(subscriptionId);
    if (!subscription) {
      return throwError(() => new Error('Subscription not found'));
    }

    const oldPlan = subscription.planId;
    subscription.planId = newPlanId;
    subscription.planName = this.getPlanName(newPlanId);
    subscription.updatedAt = new Date();
    this.mockSubscriptions.set(subscriptionId, subscription);

    this.logging.info('Plan changed', 'ADMIN', {
      subscriptionId,
      oldPlan,
      newPlan: newPlanId,
    });

    return of(subscription).pipe(delay(300));
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(
    subscriptionId: string,
    reason?: string,
    immediate: boolean = false,
  ) {
    const subscription = this.mockSubscriptions.get(subscriptionId);
    if (!subscription) {
      return throwError(() => new Error('Subscription not found'));
    }

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    subscription.cancelledReason = reason;
    subscription.autoRenew = false;
    subscription.updatedAt = new Date();
    this.mockSubscriptions.set(subscriptionId, subscription);

    this.logging.warn('Subscription cancelled', 'ADMIN', {
      subscriptionId,
      reason,
      immediate,
    });

    return of(subscription).pipe(delay(300));
  }

  /**
   * Pause subscription
   */
  pauseSubscription(subscriptionId: string, resumeAt?: Date) {
    const subscription = this.mockSubscriptions.get(subscriptionId);
    if (!subscription) {
      return throwError(() => new Error('Subscription not found'));
    }

    subscription.status = 'paused';
    subscription.autoRenew = false;
    subscription.updatedAt = new Date();
    this.mockSubscriptions.set(subscriptionId, subscription);

    return of(subscription).pipe(delay(300));
  }

  /**
   * Resume subscription
   */
  resumeSubscription(subscriptionId: string) {
    const subscription = this.mockSubscriptions.get(subscriptionId);
    if (!subscription) {
      return throwError(() => new Error('Subscription not found'));
    }

    subscription.status = 'active';
    subscription.autoRenew = true;
    subscription.updatedAt = new Date();
    this.mockSubscriptions.set(subscriptionId, subscription);

    return of(subscription).pipe(delay(300));
  }

  /**
   * Get invoices
   */
  getInvoices(organizationId: string, options?: { limit?: number; offset?: number }) {
    let invoices = Array.from(this.mockInvoices.values()).filter(
      (inv) => inv.organizationId === organizationId,
    );

    invoices = invoices.sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());

    const limit = options?.limit || 10;
    const offset = options?.offset || 0;
    const paginated = invoices.slice(offset, offset + limit);

    return of({
      data: paginated,
      total: invoices.length,
      hasMore: offset + limit < invoices.length,
    }).pipe(delay(300));
  }

  /**
   * Get invoice
   */
  getInvoice(id: string) {
    const invoice = this.mockInvoices.get(id);
    return invoice
      ? of(invoice).pipe(delay(200))
      : throwError(() => new Error('Invoice not found'));
  }

  /**
   * Download invoice PDF
   */
  downloadInvoicePDF(id: string) {
    const invoice = this.mockInvoices.get(id);
    if (!invoice) {
      return throwError(() => new Error('Invoice not found'));
    }

    // Generate PDF URL (in production, use actual PDF generation)
    const pdfUrl = `/api/invoices/${id}/pdf`;

    return of({ url: pdfUrl, fileName: `invoice_${invoice.id}.pdf` }).pipe(
      delay(300),
    );
  }

  /**
   * Get payment methods
   */
  getPaymentMethods(organizationId: string) {
    const methods = Array.from(this.mockPaymentMethods.values()).filter(
      (m) => m.organizationId === organizationId,
    );
    return of(methods).pipe(delay(300));
  }

  /**
   * Add payment method (stripe token)
   */
  addPaymentMethod(
    organizationId: string,
    stripeToken: string,
    setAsDefault: boolean = false,
  ) {
    // In production, validate token with Stripe
    const method: PaymentMethod = {
      id: `pm_${Date.now()}`,
      organizationId,
      stripePaymentMethodId: stripeToken,
      type: 'card',
      cardBrand: 'visa',
      cardLast4: '4242',
      cardExpMonth: 12,
      cardExpYear: 2025,
      status: 'active',
      isDefault: setAsDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockPaymentMethods.set(method.id, method);

    this.logging.info('Payment method added', 'ADMIN', {
      organizationId,
      methodId: method.id,
    });

    return of(method).pipe(delay(300));
  }

  /**
   * Delete payment method
   */
  deletePaymentMethod(id: string) {
    this.mockPaymentMethods.delete(id);
    this.logging.info('Payment method deleted', 'ADMIN', { methodId: id });
    return of({ success: true }).pipe(delay(300));
  }

  /**
   * Get usage metrics
   */
  getUsageMetrics(organizationId: string) {
    const metrics: UsageMetrics = {
      id: `usage_${organizationId}`,
      organizationId,
      month: new Date().toISOString().substring(0, 7),
      apiCallsUsed: 450000,
      apiCallsLimit: 1000000,
      usersUsed: 15,
      usersLimit: 999,
      teamsUsed: 2,
      teamsLimit: 999,
      storageUsed: 45,
      storageLimit: 100,
      webhooksUsed: 25,
      webhooksLimit: 100,
      lastUpdatedAt: new Date(),
    };

    return of(metrics).pipe(delay(300));
  }

  /**
   * Get billing statistics
   */
  getBillingStats(organizationId: string) {
    const invoices = Array.from(this.mockInvoices.values()).filter(
      (inv) => inv.organizationId === organizationId,
    );

    const paid = invoices.filter((inv) => inv.status === 'paid');
    const outstanding = invoices.filter((inv) => inv.status !== 'paid');

    const totalRevenue = paid.reduce((sum, inv) => sum + inv.amount, 0);
    const outstandingAmount = outstanding.reduce((sum, inv) => sum + inv.amount, 0);

    return of({
      totalInvoices: invoices.length,
      paidInvoices: paid.length,
      outstandingInvoices: outstanding.length,
      totalRevenue,
      outstandingAmount,
      averageInvoiceAmount: invoices.length > 0 ? totalRevenue / paid.length : 0,
    }).pipe(delay(300));
  }

  /**
   * Helper: Get plan name
   */
  private getPlanName(planId: string): string {
    const names: Record<string, string> = {
      plan_starter: 'Starter',
      plan_pro: 'Pro',
      plan_enterprise: 'Enterprise',
    };
    return names[planId] || 'Unknown';
  }
}
