import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { TwoFactorSecret } from '../interfaces';

@Injectable()
export class TwoFactorService {
  /**
   * Generate a secret for two-factor authentication
   */
  async generateSecret(email: string, appName: string = 'Task Manager'): Promise<TwoFactorSecret> {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${email})`,
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32 || '',
      otpAuthUrl: secret.otpauth_url || '',
      qrCode,
    };
  }

  /**
   * Verify a TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before and after
    });
  }

  /**
   * Generate backup codes for account recovery
   */
  generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
