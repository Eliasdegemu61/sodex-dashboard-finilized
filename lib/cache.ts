interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private requestInProgress: Map<string, Promise<any>> = new Map();
  private readonly TTL = 60 * 60 * 1000; // 1 hour in milliseconds

  set<T>(key: string, data: T): void {
    const expiresAt = Date.now() + this.TTL;
    this.cache.set(key, { data, expiresAt });
    console.log(`[v0] Cache SET: ${key}`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[v0] Cache HIT: ${key}`);
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.requestInProgress.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Deduplicate concurrent requests - prevent duplicate API calls
  async deduplicate<T>(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached) return cached;

    // Check if request is already in progress
    if (this.requestInProgress.has(key)) {
      console.log(`[v0] Deduplicating request: ${key}`);
      return this.requestInProgress.get(key)!;
    }

    // Create new request
    const promise = fetchFn()
      .then((data) => {
        this.set(key, data);
        this.requestInProgress.delete(key);
        return data;
      })
      .catch((error) => {
        this.requestInProgress.delete(key);
        throw error;
      });

    this.requestInProgress.set(key, promise);
    return promise;
  }

  // Clean up expired entries periodically
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Clean expired entries every 10 minutes
setInterval(() => {
  cacheManager.cleanExpired();
}, 10 * 60 * 1000);
