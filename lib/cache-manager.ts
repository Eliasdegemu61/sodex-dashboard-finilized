/**
 * Hybrid cache manager with localStorage persistence
 * - In-memory cache for fast server-side access
 * - localStorage for client-side persistence across tabs
 * - No external dependencies - works everywhere without cookie errors
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const STORAGE_PREFIX = 'sodex_cache_'

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private requestInProgress = new Map<string, Promise<any>>()
  private readonly TTL = 60 * 60 * 1000 // 1 hour in milliseconds
  private isClient = false

  constructor() {
    // Detect if running in browser
    this.isClient = typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }

  private getStorageKey(key: string): string {
    return STORAGE_PREFIX + key
  }

  set<T>(key: string, data: T): void {
    const expiresAt = Date.now() + this.TTL
    this.cache.set(key, { data, expiresAt })

    // Persist to localStorage on client side
    if (this.isClient) {
      try {
        localStorage.setItem(
          this.getStorageKey(key),
          JSON.stringify({ data, expiresAt })
        )
      } catch (error) {
        console.warn(`[v0] Failed to write to localStorage for ${key}:`, error)
      }
    } else {
    }
  }

  get<T>(key: string): T | null {
    // Check in-memory cache first
    let entry = this.cache.get(key)

    // If not in memory but on client, try to restore from localStorage
    if (!entry && this.isClient) {
      try {
        const stored = localStorage.getItem(this.getStorageKey(key))
        if (stored) {
          entry = JSON.parse(stored)
        }
      } catch (error) {
        console.warn(`[v0] Failed to read from localStorage for ${key}:`, error)
      }
    }

    if (!entry) return null

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      if (this.isClient) {
        try {
          localStorage.removeItem(this.getStorageKey(key))
        } catch {
          // Ignore
        }
      }
      return null
    }

    // Cache in memory for faster subsequent access
    if (!this.cache.has(key)) {
      this.cache.set(key, entry)
    }

    if (!this.cache.get(key) || this.cache.get(key)?.data !== entry.data) {
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      return Date.now() <= entry.expiresAt
    }

    // Check localStorage
    if (this.isClient) {
      try {
        const stored = localStorage.getItem(this.getStorageKey(key))
        if (stored) {
          const entry = JSON.parse(stored)
          return Date.now() <= entry.expiresAt
        }
      } catch {
        // Ignore
      }
    }

    return false
  }

  delete(key: string): void {
    this.cache.delete(key)
    if (this.isClient) {
      try {
        localStorage.removeItem(this.getStorageKey(key))
      } catch {
        // Ignore
      }
    }
  }

  clear(): void {
    this.cache.clear()
    this.requestInProgress.clear()

    if (this.isClient) {
      try {
        const keys = Object.keys(localStorage)
        keys.forEach((key) => {
          if (key.startsWith(STORAGE_PREFIX)) {
            localStorage.removeItem(key)
          }
        })
      } catch {
        // Ignore
      }
    }
  }

  cleanExpired(): void {
    const now = Date.now()

    // Clean in-memory cache
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }

    // Clean localStorage
    if (this.isClient) {
      try {
        const keys = Object.keys(localStorage)
        keys.forEach((key) => {
          if (key.startsWith(STORAGE_PREFIX)) {
            const stored = localStorage.getItem(key)
            if (stored) {
              try {
                const entry = JSON.parse(stored)
                if (now > entry.expiresAt) {
                  localStorage.removeItem(key)
                }
              } catch {
                localStorage.removeItem(key)
              }
            }
          }
        })
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Deduplicate concurrent requests - if multiple requests come in for the same key,
   * they all wait for the first one to complete
   */
  async deduplicate<T>(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Check cache first (includes localStorage on client)
    const cached = this.get<T>(key)
    if (cached) return cached

    // Check if request is already in progress
    if (this.requestInProgress.has(key)) {
      return this.requestInProgress.get(key)!
    }

    // Create new request
    const promise = fetchFn()
      .then((data) => {
        this.set(key, data)
        this.requestInProgress.delete(key)
        return data
      })
      .catch((error) => {
        this.requestInProgress.delete(key)
        throw error
      })

    this.requestInProgress.set(key, promise)
    return promise
  }
}

// Singleton instance
export const cacheManager = new CacheManager()

// Clean expired entries every 10 minutes
setInterval(() => {
  cacheManager.cleanExpired()
}, 10 * 60 * 1000)
