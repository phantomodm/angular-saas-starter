/**
 * Organization/Company
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: 'solo' | 'small' | 'medium' | 'large' | 'enterprise';
  country?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  status: 'active' | 'suspended' | 'deleted';
  subscriptionTierId?: string;
}

/**
 * Team/Department within organization
 */
export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'active' | 'archived';
}

/**
 * Team membership
 */
export interface TeamMember {
  id: string;
  teamId: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending_invite' | 'invited' | 'disabled';
  invitedAt?: Date;
  invitedBy?: string;
  acceptedAt?: Date;
  joinedAt: Date;
  permissions?: string[]; // Custom permissions
  metadata?: Record<string, any>;
}

/**
 * Team invite (for pending members)
 */
export interface TeamInvite {
  id: string;
  teamId: string;
  organizationId: string;
  email: string;
  inviteCode: string;
  invitedBy: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  expiresAt: Date;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  acceptedAt?: Date;
  acceptedBy?: string;
}

/**
 * Two-factor authentication configuration
 */
export interface TwoFactorAuth {
  id: string;
  userId: string;
  method: 'totp' | 'sms' | 'email' | 'authenticator';
  secret?: string; // Encrypted TOTP secret
  phoneNumber?: string; // For SMS
  backupCodes: string[]; // Hashed backup codes
  enabled: boolean;
  verified: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Email queue item
 */
export interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  template: string;
  templateData?: Record<string, any>;
  cc?: string[];
  bcc?: string[];
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  sentAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Email template
 */
export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[]; // {{variableName}}
  category: 'welcome' | 'transactional' | 'notification' | 'billing' | 'account';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  reason?: string;
  createdAt: Date;
}

/**
 * Billing subscription
 */
export interface BillingSubscription {
  id: string;
  organizationId: string;
  stripeSubscriptionId?: string;
  planId: string;
  planName: string;
  status: 'active' | 'past_due' | 'canceled' | 'paused' | 'trial';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  canceledAt?: Date;
  cancelledReason?: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Billing plan
 */
export interface BillingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
  limits: {
    users?: number;
    teams?: number;
    apiKeys?: number;
    webhooks?: number;
    monthlyApiCalls?: number;
    storage?: number; // GB
  };
  status: 'active' | 'deprecated';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plan feature
 */
export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
}

/**
 * Invoice
 */
export interface Invoice {
  id: string;
  organizationId: string;
  stripeInvoiceId?: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'failed' | 'refunded';
  issuedAt: Date;
  dueAt: Date;
  paidAt?: Date;
  lineItems: InvoiceLineItem[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata?: Record<string, any>;
}

/**
 * Usage metrics for billing
 */
export interface UsageMetrics {
  id: string;
  organizationId: string;
  month: string; // YYYY-MM
  apiCallsUsed: number;
  apiCallsLimit: number;
  usersUsed: number;
  usersLimit: number;
  teamsUsed: number;
  teamsLimit: number;
  storageUsed: number; // MB
  storageLimit: number; // MB
  webhooksUsed: number;
  webhooksLimit: number;
  lastUpdatedAt: Date;
}

/**
 * Payment method
 */
export interface PaymentMethod {
  id: string;
  organizationId: string;
  stripePaymentMethodId?: string;
  type: 'card' | 'bank_account' | 'wallet';
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  status: 'active' | 'inactive';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
