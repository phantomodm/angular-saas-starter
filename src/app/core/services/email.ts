import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay, throwError } from 'rxjs';
import { EmailQueueItem, EmailTemplate } from '../models/organization.model';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private http = inject(HttpClient);
  private logging = inject(LoggingService);
  private mockQueue = new Map<string, EmailQueueItem>();
  private mockTemplates = new Map<string, EmailTemplate>();
  private queueId = 0;

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock templates
   */
  private initializeMockData(): void {
    const templates: EmailTemplate[] = [
      {
        id: 'tpl_welcome',
        name: 'Welcome Email',
        slug: 'welcome',
        subject: 'Welcome to {{appName}}!',
        htmlContent: `<h1>Welcome {{displayName}}!</h1>
          <p>We're excited to have you on board.</p>
          <p><a href="{{verifyLink}}">Verify your email</a></p>`,
        category: 'welcome',
        variables: ['displayName', 'appName', 'verifyLink'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'tpl_password_reset',
        name: 'Password Reset',
        slug: 'password-reset',
        subject: 'Reset your password',
        htmlContent: `<h1>Password Reset</h1>
          <p>Click below to reset your password:</p>
          <p><a href="{{resetLink}}">Reset Password</a></p>
          <p>This link expires in 1 hour.</p>`,
        category: 'transactional',
        variables: ['resetLink'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'tpl_team_invite',
        name: 'Team Invitation',
        slug: 'team-invite',
        subject: '{{senderName}} invited you to {{teamName}}',
        htmlContent: `<h1>You're Invited!</h1>
          <p>{{senderName}} invited you to join the team {{teamName}}.</p>
          <p><a href="{{inviteLink}}">Accept Invitation</a></p>`,
        category: 'transactional',
        variables: ['senderName', 'teamName', 'inviteLink'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'tpl_invoice',
        name: 'Invoice',
        slug: 'invoice',
        subject: 'Invoice #{{invoiceNumber}}',
        htmlContent: `<h1>Invoice #{{invoiceNumber}}</h1>
          <p>Amount due: {{amount}} {{currency}}</p>
          <p>Due date: {{dueDate}}</p>`,
        category: 'billing',
        variables: ['invoiceNumber', 'amount', 'currency', 'dueDate'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'tpl_2fa_code',
        name: '2FA Code',
        slug: '2fa-code',
        subject: 'Your authentication code',
        htmlContent: `<h1>Your Authentication Code</h1>
          <p>Your code is: <strong>{{code}}</strong></p>
          <p>This code expires in 5 minutes.</p>`,
        category: 'account',
        variables: ['code'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    templates.forEach((tpl) => this.mockTemplates.set(tpl.id, tpl));
  }

  /**
   * Send email (add to queue)
   */
  sendEmail(to: string, templateId: string, templateData?: Record<string, any>) {
    const template = this.mockTemplates.get(templateId);
    if (!template) {
      return throwError(() => new Error(`Template ${templateId} not found`));
    }

    const subject = this.renderTemplate(template.subject, templateData || {});

    const queueItem: EmailQueueItem = {
      id: `email_${++this.queueId}`,
      to,
      subject,
      template: templateId,
      templateData,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockQueue.set(queueItem.id, queueItem);

    // Log email sent
    this.logging.info(`Email queued to ${to}`, 'APP', {
      emailId: queueItem.id,
      template: templateId,
      to,
    });

    return of(queueItem).pipe(delay(200));
  }

  /**
   * Get email queue
   */
  getEmailQueue() {
    const items = Array.from(this.mockQueue.values());
    return of(items).pipe(delay(300));
  }

  /**
   * Get email by ID
   */
  getEmailById(id: string) {
    const email = this.mockQueue.get(id);
    return email ? of(email).pipe(delay(200)) : throwError(() => new Error('Email not found'));
  }

  /**
   * Retry failed email
   */
  retryEmail(id: string) {
    const email = this.mockQueue.get(id);
    if (!email) return throwError(() => new Error('Email not found'));

    // Simulate successful retry
    if (email.attempts < email.maxAttempts) {
      email.attempts++;
      email.status = 'sent';
      email.sentAt = new Date();
      email.updatedAt = new Date();
      this.mockQueue.set(id, email);

      this.logging.info(`Email sent successfully`, 'APP', { emailId: id, to: email.to });
    } else {
      email.status = 'failed';
      email.failureReason = 'Max attempts exceeded';
      this.mockQueue.set(id, email);
    }

    return of(email).pipe(delay(300));
  }

  /**
   * Resend email
   */
  resendEmail(to: string, templateId: string, templateData?: Record<string, any>) {
    return this.sendEmail(to, templateId, templateData);
  }

  /**
   * Get email templates
   */
  getTemplates() {
    const templates = Array.from(this.mockTemplates.values());
    return of(templates).pipe(delay(300));
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string) {
    const template = this.mockTemplates.get(id);
    return template ? of(template).pipe(delay(200)) : throwError(() => new Error('Template not found'));
  }

  /**
   * Create/update template
   */
  saveTemplate(data: Partial<EmailTemplate>) {
    if (data.id && this.mockTemplates.has(data.id)) {
      // Update
      const template = this.mockTemplates.get(data.id)!;
      const updated = { ...template, ...data, updatedAt: new Date() };
      this.mockTemplates.set(data.id, updated);
      return of(updated).pipe(delay(300));
    } else {
      // Create
      const template: EmailTemplate = {
        id: `tpl_${Date.now()}`,
        name: data.name || '',
        slug: (data.name || '').toLowerCase().replace(/\s+/g, '-'),
        subject: data.subject || '',
        htmlContent: data.htmlContent || '',
        category: data.category || 'transactional',
        variables: data.variables || [],
        active: data.active !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.mockTemplates.set(template.id, template);
      return of(template).pipe(delay(300));
    }
  }

  /**
   * Test send email
   */
  testSend(to: string, templateId: string, templateData?: Record<string, any>) {
    return this.sendEmail(to, templateId, templateData);
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, String(value));
    });
    return result;
  }

  /**
   * Get unread count
   */
  getQueueStats() {
    const items = Array.from(this.mockQueue.values());
    return of({
      total: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      sent: items.filter((i) => i.status === 'sent').length,
      failed: items.filter((i) => i.status === 'failed').length,
    }).pipe(delay(300));
  }
}