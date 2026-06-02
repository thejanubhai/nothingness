export class RateLimit {
  private requests: Map<string, number[]>;
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 10, windowMs: number = 60000) {
    this.requests = new Map();
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    let userRequests = this.requests.get(identifier) || [];
    
    // Filter out requests older than the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (userRequests.length >= this.limit) {
      // Limit exceeded
      this.requests.set(identifier, userRequests);
      return false;
    }
    
    // Add current request
    userRequests.push(now);
    this.requests.set(identifier, userRequests);
    return true;
  }
}

// Export singleton instances for different API routes
export const verifyIdRateLimit = new RateLimit(5, 60000); // 5 requests per minute
export const contactRateLimit = new RateLimit(3, 60000); // 3 requests per minute
export const webhookRateLimit = new RateLimit(100, 60000); // 100 requests per minute
