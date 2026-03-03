import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  BillingSubscription,
  Invoice,
  PaymentMethod,
  UsageMetrics,
} from '../models/organization.model';
import { LoggingService } from './logging.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private http = inject(HttpClient);
  private logging = inject(LoggingService);

  getSubscription(organizationId: string): Observable<BillingSubscription> {
    return this.http
      .get<ApiResponse<any>>(`/api/org/${organizationId}/dashboard`)
      .pipe(
        map((response) => {
          const now = new Date();
          return {
            id: `sub_${organizationId}`,
            organizationId,
            stripeSubscriptionId: undefined,
            planId: 'plan_pro',
            planName: 'Pro',
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: new Date(
              now.getTime() + 30 * 24 * 60 * 60 * 1000,
            ),
            autoRenew: true,
            createdAt: now,
            updatedAt: now,
          } as BillingSubscription;
        }),
        catchError((error) =>
          throwError(
            () => new Error(error?.error?.detail || 'Subscription not found'),
          ),
        ),
      );
  }

  createSubscription(
    organizationId: string,
    planId: string,
  ): Observable<BillingSubscription> {
    return this.http
      .post<
        ApiResponse<any>
      >(`/api/billing/subscriptions`, { organizationId, planId })
      .pipe(
        map((response) =>
          this.mapSubscription(response.data, organizationId, planId),
        ),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.detail || 'Failed to create subscription',
              ),
          ),
        ),
      );
  }

  changePlan(
    subscriptionId: string,
    newPlanId: string,
    prorationBehavior: string = 'create_prorations',
  ): Observable<BillingSubscription> {
    return this.http
      .patch<ApiResponse<any>>(`/api/billing/subscriptions/${subscriptionId}`, {
        planId: newPlanId,
        prorationBehavior,
      })
      .pipe(
        map((response) =>
          this.mapSubscription(
            response.data,
            response.data?.organizationId,
            newPlanId,
            subscriptionId,
          ),
        ),
        catchError((error) =>
          throwError(
            () => new Error(error?.error?.detail || 'Failed to change plan'),
          ),
        ),
      );
  }

  cancelSubscription(
    subscriptionId: string,
    reason?: string,
    immediate: boolean = false,
  ): Observable<BillingSubscription> {
    return this.http
      .post<ApiResponse<any>>(
        `/api/billing/subscriptions/${subscriptionId}/cancel`,
        {
          reason,
          immediate,
        },
      )
      .pipe(
        map((response) =>
          this.mapSubscription(
            response.data,
            response.data?.organizationId,
            response.data?.planId,
            subscriptionId,
          ),
        ),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.detail || 'Failed to cancel subscription',
              ),
          ),
        ),
      );
  }

  pauseSubscription(
    subscriptionId: string,
    resumeAt?: Date,
  ): Observable<BillingSubscription> {
    return this.http
      .post<ApiResponse<any>>(
        `/api/billing/subscriptions/${subscriptionId}/pause`,
        {
          resumeAt: resumeAt?.toISOString(),
        },
      )
      .pipe(
        map((response) =>
          this.mapSubscription(
            response.data,
            response.data?.organizationId,
            response.data?.planId,
            subscriptionId,
          ),
        ),
        catchError((error) =>
          throwError(
            () =>
              new Error(error?.error?.detail || 'Failed to pause subscription'),
          ),
        ),
      );
  }

  resumeSubscription(subscriptionId: string): Observable<BillingSubscription> {
    return this.http
      .post<
        ApiResponse<any>
      >(`/api/billing/subscriptions/${subscriptionId}/resume`, {})
      .pipe(
        map((response) =>
          this.mapSubscription(
            response.data,
            response.data?.organizationId,
            response.data?.planId,
            subscriptionId,
          ),
        ),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.detail || 'Failed to resume subscription',
              ),
          ),
        ),
      );
  }

  getInvoices(
    organizationId: string,
    options?: { limit?: number; offset?: number },
  ): Observable<{ data: Invoice[]; total: number; hasMore: boolean }> {
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    return this.http
      .get<
        ApiResponse<{ invoices?: any[]; total?: number }>
      >(`/api/billing/invoices?organizationId=${organizationId}&limit=${limit}&offset=${offset}`)
      .pipe(
        map((response) => {
          const invoices = (response.data?.invoices || []).map((invoice) =>
            this.mapInvoice(invoice, organizationId),
          );
          const total = response.data?.total || invoices.length;
          return {
            data: invoices,
            total,
            hasMore: offset + limit < total,
          };
        }),
        catchError(() => of({ data: [], total: 0, hasMore: false })),
      );
  }

  getInvoice(id: string): Observable<Invoice> {
    return this.http.get<ApiResponse<any>>(`/api/billing/invoices/${id}`).pipe(
      map((response) =>
        this.mapInvoice(
          response.data,
          response.data?.organizationId || 'unknown',
        ),
      ),
      catchError((error) =>
        throwError(
          () => new Error(error?.error?.detail || 'Invoice not found'),
        ),
      ),
    );
  }

  downloadInvoicePDF(
    id: string,
  ): Observable<{ url: string; fileName: string }> {
    return this.http
      .get<
        ApiResponse<{ url?: string; fileName?: string }>
      >(`/api/billing/invoices/${id}/pdf`)
      .pipe(
        map((response) => ({
          url: response.data?.url || `/api/invoices/${id}/pdf`,
          fileName: response.data?.fileName || `invoice_${id}.pdf`,
        })),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.detail || 'Failed to download invoice PDF',
              ),
          ),
        ),
      );
  }

  getPaymentMethods(organizationId: string): Observable<PaymentMethod[]> {
    return this.http
      .get<
        ApiResponse<{ paymentMethods?: any[] }>
      >(`/api/billing/payment-methods?organizationId=${organizationId}`)
      .pipe(
        map((response) =>
          (response.data?.paymentMethods || []).map((method) =>
            this.mapPaymentMethod(method, organizationId),
          ),
        ),
        catchError(() => of([])),
      );
  }

  addPaymentMethod(
    organizationId: string,
    stripeToken: string,
    setAsDefault: boolean = false,
  ): Observable<PaymentMethod> {
    return this.http
      .post<ApiResponse<any>>(`/api/billing/payment-methods`, {
        organizationId,
        stripeToken,
        setAsDefault,
      })
      .pipe(
        map((response) => this.mapPaymentMethod(response.data, organizationId)),
        catchError((error) =>
          throwError(
            () =>
              new Error(error?.error?.detail || 'Failed to add payment method'),
          ),
        ),
      );
  }

  deletePaymentMethod(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<any>>(`/api/billing/payment-methods/${id}`)
      .pipe(
        map(() => ({ success: true })),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.detail || 'Failed to delete payment method',
              ),
          ),
        ),
      );
  }

  getUsageMetrics(organizationId: string): Observable<UsageMetrics> {
    return this.http
      .get<ApiResponse<any>>(`/api/org/${organizationId}/dashboard`)
      .pipe(
        map((response) => {
          const kpis = response.data?.dashboard?.kpis || {};
          return {
            id: `usage_${organizationId}`,
            organizationId,
            month: new Date().toISOString().substring(0, 7),
            apiCallsUsed: Number(kpis.api_calls_this_month || 0),
            apiCallsLimit: 1000000,
            usersUsed: Number(kpis.total_users || 0),
            usersLimit: 999,
            teamsUsed: Number(kpis.active_features || 0),
            teamsLimit: 999,
            storageUsed: 0,
            storageLimit: 100,
            webhooksUsed: 0,
            webhooksLimit: 100,
            lastUpdatedAt: new Date(),
          };
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.detail || 'Failed to fetch usage metrics',
              ),
          ),
        ),
      );
  }

  getBillingStats(organizationId: string): Observable<{
    totalInvoices: number;
    paidInvoices: number;
    outstandingInvoices: number;
    totalRevenue: number;
    outstandingAmount: number;
    averageInvoiceAmount: number;
  }> {
    return this.getInvoices(organizationId, { limit: 100, offset: 0 }).pipe(
      map(({ data }) => {
        const paid = data.filter((inv) => inv.status === 'paid');
        const outstanding = data.filter((inv) => inv.status !== 'paid');
        const totalRevenue = paid.reduce((sum, inv) => sum + inv.amount, 0);
        const outstandingAmount = outstanding.reduce(
          (sum, inv) => sum + inv.amount,
          0,
        );

        return {
          totalInvoices: data.length,
          paidInvoices: paid.length,
          outstandingInvoices: outstanding.length,
          totalRevenue,
          outstandingAmount,
          averageInvoiceAmount:
            paid.length > 0 ? totalRevenue / paid.length : 0,
        };
      }),
    );
  }

  private mapSubscription(
    data: any,
    organizationId: string,
    planId: string,
    subscriptionId?: string,
  ): BillingSubscription {
    const now = new Date();
    const currentPlanId = planId || data?.planId || 'plan_pro';

    return {
      id: data?.id || subscriptionId || `sub_${Date.now()}`,
      organizationId: organizationId || data?.organizationId || 'unknown',
      stripeSubscriptionId: data?.stripeSubscriptionId,
      planId: currentPlanId,
      planName: data?.planName || this.getPlanName(currentPlanId),
      status: data?.status || 'active',
      currentPeriodStart: data?.currentPeriodStart
        ? new Date(data.currentPeriodStart)
        : now,
      currentPeriodEnd: data?.currentPeriodEnd
        ? new Date(data.currentPeriodEnd)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      trialEndsAt: data?.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
      canceledAt: data?.canceledAt ? new Date(data.canceledAt) : undefined,
      cancelledReason: data?.cancelledReason,
      autoRenew: data?.autoRenew ?? true,
      createdAt: data?.createdAt ? new Date(data.createdAt) : now,
      updatedAt: data?.updatedAt ? new Date(data.updatedAt) : now,
    };
  }

  private mapInvoice(data: any, organizationId: string): Invoice {
    return {
      id: data?.id || `inv_${Date.now()}`,
      organizationId,
      stripeInvoiceId: data?.stripeInvoiceId,
      subscriptionId: data?.subscriptionId || '',
      amount: Number(data?.amount || 0),
      currency: data?.currency || 'USD',
      status: data?.status || 'draft',
      issuedAt: data?.issuedAt ? new Date(data.issuedAt) : new Date(),
      dueAt: data?.dueAt ? new Date(data.dueAt) : new Date(),
      paidAt: data?.paidAt ? new Date(data.paidAt) : undefined,
      lineItems: data?.lineItems || [],
      metadata: data?.metadata,
      createdAt: data?.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data?.updatedAt ? new Date(data.updatedAt) : new Date(),
    };
  }

  private mapPaymentMethod(data: any, organizationId: string): PaymentMethod {
    return {
      id: data?.id || `pm_${Date.now()}`,
      organizationId,
      stripePaymentMethodId: data?.stripePaymentMethodId,
      type: data?.type || 'card',
      cardBrand: data?.cardBrand,
      cardLast4: data?.cardLast4,
      cardExpMonth: data?.cardExpMonth,
      cardExpYear: data?.cardExpYear,
      status: data?.status || 'active',
      isDefault: data?.isDefault ?? false,
      createdAt: data?.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data?.updatedAt ? new Date(data.updatedAt) : new Date(),
    };
  }

  private getPlanName(planId: string): string {
    const names: Record<string, string> = {
      plan_starter: 'Starter',
      plan_pro: 'Pro',
      plan_enterprise: 'Enterprise',
    };
    return names[planId] || 'Unknown';
  }
}
