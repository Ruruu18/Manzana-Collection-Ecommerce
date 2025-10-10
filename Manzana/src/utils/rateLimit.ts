/**
 * Rate limiting utilities for authentication and sensitive operations
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if an identifier (email/IP) is rate limited
   */
  isRateLimited(identifier: string): { limited: boolean; remainingTime?: number } {
    const record = this.attempts.get(identifier);
    const now = Date.now();

    if (!record) {
      return { limited: false };
    }

    // Check if currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return {
        limited: true,
        remainingTime: Math.ceil((record.blockedUntil - now) / 1000), // seconds
      };
    }

    // Check if window has expired
    if (now - record.firstAttemptTime > this.config.windowMs) {
      // Window expired, reset
      this.attempts.delete(identifier);
      return { limited: false };
    }

    // Check if max attempts exceeded
    if (record.count >= this.config.maxAttempts) {
      // Block the identifier
      record.blockedUntil = now + this.config.blockDurationMs;
      return {
        limited: true,
        remainingTime: Math.ceil(this.config.blockDurationMs / 1000),
      };
    }

    return { limited: false };
  }

  /**
   * Record an attempt
   */
  recordAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttemptTime: now,
      });
      return;
    }

    // Check if window has expired
    if (now - record.firstAttemptTime > this.config.windowMs) {
      // Reset for new window
      this.attempts.set(identifier, {
        count: 1,
        firstAttemptTime: now,
      });
      return;
    }

    // Increment count
    record.count++;
  }

  /**
   * Reset attempts for an identifier (e.g., after successful login)
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.attempts.clear();
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) {
      return this.config.maxAttempts;
    }

    const now = Date.now();
    if (now - record.firstAttemptTime > this.config.windowMs) {
      return this.config.maxAttempts;
    }

    return Math.max(0, this.config.maxAttempts - record.count);
  }
}

// Authentication rate limiter: 5 attempts per 15 minutes
export const authRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
});

// Password reset rate limiter: 3 attempts per hour
export const passwordResetRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours block
});

// Registration rate limiter: 3 attempts per hour
export const registrationRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours block
});

/**
 * Format remaining time for user display
 */
export const formatRemainingTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
};
