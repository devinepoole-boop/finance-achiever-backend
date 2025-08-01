// import memoize from 'memoizee'; // Commented out for now

// No Redis imports or configuration - using memory cache only
let redisClient: any = null;

// Skip Redis initialization entirely to prevent connection errors
async function initializeRedis() {
  // Always use memory cache - no Redis connection attempts
  console.log('Using memory cache (Redis disabled)');
  return null;
}

// Cache key generators
export const CacheKeys = {
  courses: (limit?: number) => `courses:all${limit ? `:${limit}` : ''}`,
  course: (id: string) => `course:${id}`,
  communities: (limit?: number) => `communities:all${limit ? `:${limit}` : ''}`,
  community: (id: string) => `community:${id}`,
  posts: (communityId?: string, limit?: number) => 
    `posts${communityId ? `:${communityId}` : ':all'}${limit ? `:${limit}` : ''}`,
  userProgress: (userId: string) => `progress:${userId}`,
  financialAccounts: (userId: string) => `accounts:${userId}`,
  transactions: (userId: string, limit?: number) => 
    `transactions:${userId}${limit ? `:${limit}` : ''}`,
  analytics: (userId: string) => `analytics:${userId}`,
  creditReport: (userId: string, bureau?: string) => 
    `credit:${userId}${bureau ? `:${bureau}` : ''}`,
};

// Cache TTL configurations (in seconds)
export const CacheTTL = {
  courses: 3600,        // 1 hour
  communities: 1800,    // 30 minutes
  posts: 300,          // 5 minutes
  userProgress: 600,    // 10 minutes
  financial: 300,       // 5 minutes
  analytics: 1800,      // 30 minutes
  creditReport: 86400,  // 24 hours
};

// Generic cache interface
interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Redis cache adapter disabled to prevent connection errors
// class RedisCacheAdapter implements CacheAdapter { ... } - REMOVED

// Memory cache adapter (fallback) with automatic cleanup
class MemoryCacheAdapter implements CacheAdapter {
  private cache = new Map<string, { value: any; expires: number }>();
  private maxSize = 100; // Severely limit cache size to prevent memory leaks
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Run cleanup every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    let deleted = 0;
    
    // Remove expired items
    this.cache.forEach((item, key) => {
      if (now > item.expires) {
        this.cache.delete(key);
        deleted++;
      }
    });
    
    // If still too large, remove oldest items
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      const toDelete = this.cache.size - this.maxSize;
      
      for (let i = 0; i < toDelete; i++) {
        this.cache.delete(entries[i][0]);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      console.log(`Cache cleanup: removed ${deleted} items, ${this.cache.size} remaining`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set<T>(key: string, value: T, ttlSeconds = CacheTTL.courses): Promise<void> {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expires });
    
    // Check if we need to cleanup after adding
    if (this.cache.size > this.maxSize * 1.2) {
      this.cleanup();
    }
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Cache instance
let cacheAdapter: CacheAdapter;

// Initialize cache - memory only
export async function initializeCache(): Promise<CacheAdapter> {
  // Always use memory cache to prevent Redis connection errors
  cacheAdapter = new MemoryCacheAdapter();
  console.log('Using memory cache');
  
  return cacheAdapter;
}

// Cache utilities
export function getCache(): CacheAdapter {
  if (!cacheAdapter) {
    throw new Error('Cache not initialized. Call initializeCache() first.');
  }
  return cacheAdapter;
}

// Memoized functions for frequently accessed data (can be enabled when memoizee is needed)
export const memoizedFunctions = {
  // Placeholder for future memoized functions
};

// Cache invalidation patterns
export const CacheInvalidation = {
  // Clear all course-related cache
  courses: async () => {
    const cache = getCache();
    await cache.del(CacheKeys.courses());
    await cache.del(CacheKeys.courses(6));
  },
  
  // Clear user-specific cache
  user: async (userId: string) => {
    const cache = getCache();
    await Promise.all([
      cache.del(CacheKeys.userProgress(userId)),
      cache.del(CacheKeys.financialAccounts(userId)),
      cache.del(CacheKeys.transactions(userId)),
      cache.del(CacheKeys.analytics(userId)),
    ]);
  },
  
  // Clear community-related cache
  community: async (communityId?: string) => {
    const cache = getCache();
    await cache.del(CacheKeys.communities());
    if (communityId) {
      await cache.del(CacheKeys.community(communityId));
      await cache.del(CacheKeys.posts(communityId));
    }
  },
};

// Performance monitoring
export function trackCachePerformance() {
  const stats = {
    hits: 0,
    misses: 0,
    errors: 0,
  };
  
  return {
    recordHit: () => stats.hits++,
    recordMiss: () => stats.misses++,
    recordError: () => stats.errors++,
    getStats: () => ({
      ...stats,
      hitRate: stats.hits / (stats.hits + stats.misses),
    }),
  };
}

export const cacheStats = trackCachePerformance();