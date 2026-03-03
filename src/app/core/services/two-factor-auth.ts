import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay, throwError } from 'rxjs';
import { TwoFactorAuth } from '../models/organization.model';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class TwoFactorAuthService {
  private http = inject(HttpClient);
  private logging = inject(LoggingService);
  private mock2FA = new Map<string, TwoFactorAuth>();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock data
   */
  private initializeMockData(): void {
    // Admin has 2FA enabled
    const admin2FA: TwoFactorAuth = {
      id: '2fa_1',
      userId: '1',
      method: 'totp',
      secret: 'JBSWY3DPEBLW64TMMQ======', // Mock secret (encrypted in production)
      backupCodes: this.generateBackupCodes(),
      enabled: true,
      verified: true,
      createdAt: new Date('2024-01-15'),
      lastUsedAt: new Date(),
    };
    this.mock2FA.set(admin2FA.userId, admin2FA);
  }

  /**
   * Enable 2FA for user
   */
  enable2FA(userId: string, method: 'totp' | 'sms' | 'email' = 'totp') {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();

    const twoFA: TwoFactorAuth = {
      id: `2fa_${Date.now()}`,
      userId,
      method,
      secret, // In production, encrypt this
      backupCodes, // In production, hash these
      enabled: false, // Not enabled until verified
      verified: false,
      createdAt: new Date(),
    };

    this.mock2FA.set(userId, twoFA);

    // Log 2FA setup initiated
    this.logging.info('2FA setup initiated', 'SECURITY', { userId, method }, ['2fa', 'setup']);

    return of({
      secret,
      qrCode: this.generateQRCode(secret),
      backupCodes,
    }).pipe(delay(300));
  }

  /**
   * Verify 2FA setup
   */
  verify2FA(userId: string, code: string) {
    const twoFA = this.mock2FA.get(userId);
    if (!twoFA) {
      return throwError(() => new Error('2FA not found'));
    }

    // Verify code (in production, use proper TOTP validation)
    if (this.verifyTOTPCode(code, twoFA.secret || '')) {
      twoFA.enabled = true;
      twoFA.verified = true;
      this.mock2FA.set(userId, twoFA);

      this.logging.info('2FA enabled', 'SECURITY', { userId }, ['2fa', 'enabled']);

      return of({ success: true, message: '2FA enabled successfully' }).pipe(delay(300));
    } else {
      return throwError(() => new Error('Invalid code'));
    }
  }

  /**
   * Verify TOTP code on login
   */
  verifyTOTPCode(code: string, secret: string): boolean {
    // Simplified TOTP verification for mock
    // In production, use proper TOTP library like speakeasy
    // Check current and adjacent time windows
    const validCodes = this.generateValidCodes(secret);
    return validCodes.includes(code);
  }

  /**
   * Generate valid TOTP codes (for testing)
   */
  private generateValidCodes(secret: string): string[] {
    // Mock: return some valid codes for demo
    // In production, use proper TOTP generation
    const codes = ['123456', '234567', '345678', '456789'];
    return codes;
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(userId: string, code: string) {
    const twoFA = this.mock2FA.get(userId);
    if (!twoFA) {
      return throwError(() => new Error('2FA not found'));
    }

    const backupCodes = twoFA.backupCodes || [];
    const index = backupCodes.indexOf(code);

    if (index !== -1) {
      // Remove used backup code
      backupCodes.splice(index, 1);
      twoFA.backupCodes = backupCodes;
      this.mock2FA.set(userId, twoFA);

      this.logging.info('Backup code used', 'SECURITY', { userId }, ['2fa', 'backup-code']);

      return of({ success: true, codesRemaining: backupCodes.length }).pipe(delay(300));
    } else {
      this.logging.warn('Invalid backup code attempt', 'SECURITY', { userId }, [
        '2fa',
        'backup-code',
        'invalid',
      ]);
      return throwError(() => new Error('Invalid backup code'));
    }
  }

  /**
   * Generate new backup codes
   */
  generateNewBackupCodes(userId: string) {
    const twoFA = this.mock2FA.get(userId);
    if (!twoFA) {
      return throwError(() => new Error('2FA not found'));
    }

    const backupCodes = this.generateBackupCodes();
    twoFA.backupCodes = backupCodes;
    this.mock2FA.set(userId, twoFA);

    this.logging.info('Backup codes regenerated', 'SECURITY', { userId }, [
      '2fa',
      'backup-codes',
    ]);

    return of({ backupCodes }).pipe(delay(300));
  }

  /**
   * Disable 2FA
   */
  disable2FA(userId: string, password?: string) {
    // In production, verify password before disabling
    this.mock2FA.delete(userId);

    this.logging.warn('2FA disabled', 'SECURITY', { userId }, ['2fa', 'disabled']);

    return of({ success: true }).pipe(delay(300));
  }

  /**
   * Get 2FA status
   */
  get2FAStatus(userId: string): any {
    const twoFA = this.mock2FA.get(userId);
    if (!twoFA) {
      return of({ enabled: false, method: null, verified: false }).pipe(delay(200));
    }

    return of({
      enabled: twoFA.enabled,
      method: twoFA.method,
      verified: twoFA.verified,
      backupCodesCount: twoFA.backupCodes?.length || 0,
      lastUsedAt: twoFA.lastUsedAt,
    }).pipe(delay(200));
  }

  /**
   * Generate TOTP secret
   */
  private generateSecret(): string {
    // In production, use proper TOTP library (speakeasy, otplib, etc.)
    // Mock: return base32 encoded string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Generate QR code
   */
  private generateQRCode(secret: string): string {
    // In production, use qrcode library
    // Return data URL for QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Fusion:user@example.com?secret=${secret}&issuer=Fusion`;
  }

  /**
   * Generate backup codes (10 codes, 8 characters each)
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Validate 2FA code format
   */
  isValidCodeFormat(code: string): boolean {
    return /^\d{6}$/.test(code);
  }

  /**
   * Send 2FA code via SMS or email
   */
  send2FACode(userId: string, method: 'sms' | 'email') {
    const code = Math.random().toString().substring(2, 8);

    // In production, send actual SMS/email
    console.log(`2FA Code for ${userId} (${method}): ${code}`);

    this.logging.info(`2FA code sent via ${method}`, 'SECURITY', { userId, method }, [
      '2fa',
      'code-sent',
    ]);

    return of({ success: true }).pipe(delay(500));
  }
}