type RateLimitOptions = {
  maxAttempts: number;
  windowMs: number;
  now?: () => number;
};

type Entry = { count: number; resetAt: number };

export class LoginRateLimiter {
  private readonly attempts = new Map<string, Entry>();
  private readonly now: () => number;
  private readonly options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = options;
    this.now = options.now ?? Date.now;
  }

  consume(key: string) {
    const now = this.now();
    const current = this.attempts.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + this.options.windowMs }
      : current;
    entry.count += 1;
    this.attempts.set(key, entry);
    return {
      allowed: entry.count <= this.options.maxAttempts,
      retryAfterMs: Math.max(0, entry.resetAt - now)
    };
  }

  reset(key: string) {
    this.attempts.delete(key);
  }
}

export const adminLoginRateLimiter = new LoginRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 });
