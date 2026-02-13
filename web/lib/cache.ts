// Server-side LRU cache for community data and query results

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Singleton caches for different data types
import type { CytoscapeElement } from "./graph-data";

export const communityCache = new LRUCache<CytoscapeElement[]>(50, 5 * 60 * 1000);
export const searchCache = new LRUCache<CytoscapeElement[]>(100, 2 * 60 * 1000);
export const statsCache = new LRUCache<Record<string, unknown>>(1, 60 * 1000);
