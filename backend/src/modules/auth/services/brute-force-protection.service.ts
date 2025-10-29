import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class BruteForceProtectionService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 900; // 15 minutes in seconds
  private readonly ATTEMPT_WINDOW = 300; // 5 minutes in seconds

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Get the cache key for tracking login attempts
   */
  private getAttemptKey(identifier: string): string {
    return `auth:attempts:${identifier}`;
  }

  /**
   * Get the cache key for account lockout
   */
  private getLockoutKey(identifier: string): string {
    return `auth:lockout:${identifier}`;
  }

  /**
   * Check if an account is locked
   */
  async isLocked(identifier: string): Promise<boolean> {
    const lockout = await this.cacheManager.get(this.getLockoutKey(identifier));
    return !!lockout;
  }

  /**
   * Get remaining lockout time in seconds
   */
  async getRemainingLockoutTime(identifier: string): Promise<number> {
    const lockoutKey = this.getLockoutKey(identifier);
    const lockoutTime = await this.cacheManager.get<number>(lockoutKey);
    
    if (!lockoutTime) {
      return 0;
    }

    const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(identifier: string): Promise<void> {
    const attemptKey = this.getAttemptKey(identifier);
    const attempts = (await this.cacheManager.get<number>(attemptKey)) || 0;
    const newAttempts = attempts + 1;

    await this.cacheManager.set(
      attemptKey,
      newAttempts,
      this.ATTEMPT_WINDOW * 1000,
    );

    // Lock account if max attempts exceeded
    if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      await this.lockAccount(identifier);
    }
  }

  /**
   * Lock an account
   */
  private async lockAccount(identifier: string): Promise<void> {
    const lockoutTime = Date.now() + this.LOCKOUT_DURATION * 1000;
    await this.cacheManager.set(
      this.getLockoutKey(identifier),
      lockoutTime,
      this.LOCKOUT_DURATION * 1000,
    );
  }

  /**
   * Reset failed attempts counter (after successful login)
   */
  async resetAttempts(identifier: string): Promise<void> {
    await this.cacheManager.del(this.getAttemptKey(identifier));
    await this.cacheManager.del(this.getLockoutKey(identifier));
  }

  /**
   * Check if login should be blocked
   */
  async checkAndThrow(identifier: string): Promise<void> {
    if (await this.isLocked(identifier)) {
      const remainingTime = await this.getRemainingLockoutTime(identifier);
      const minutes = Math.ceil(remainingTime / 60);
      throw new UnauthorizedException(
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutes} minute(s).`,
      );
    }
  }

  /**
   * Get remaining attempts before lockout
   */
  async getRemainingAttempts(identifier: string): Promise<number> {
    const attemptKey = this.getAttemptKey(identifier);
    const attempts = (await this.cacheManager.get<number>(attemptKey)) || 0;
    return Math.max(0, this.MAX_LOGIN_ATTEMPTS - attempts);
  }
}
