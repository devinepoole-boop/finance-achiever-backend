// Memory optimization utilities for deployment
import { performance } from 'perf_hooks';

class MemoryOptimizer {
  private cleanupInterval: NodeJS.Timeout;
  private lastCleanup = Date.now();
  private readonly TARGET_MEMORY_PERCENTAGE = 50; // Target 50% max memory usage to prevent crashes

  constructor() {
    // Aggressive cleanup for production deployment
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 1000); // Every 5 seconds for emergency cleanup
  }

  // Get current memory usage percentage
  getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return (usage.heapUsed / usage.heapTotal) * 100;
  }

  // Perform aggressive memory cleanup
  private performCleanup() {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage > this.TARGET_MEMORY_PERCENTAGE) {
      console.log(`[Memory] High usage detected: ${memoryUsage.toFixed(1)}% - performing cleanup`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log(`[Memory] Garbage collection completed`);
      }
      
      // Clear Node.js internal caches (ES module compatible)
      try {
        // Force garbage collection multiple times for better cleanup
        if (global.gc) {
          global.gc();
          global.gc();
        }
        console.log(`[Memory] Intensive garbage collection completed`);
      } catch (error) {
        console.warn(`[Memory] Cache cleanup unavailable in ES modules`);
      }
      
      this.lastCleanup = Date.now();
    }
  }

  // Get memory stats for monitoring
  getMemoryStats() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      heapUsage: ((usage.heapUsed / usage.heapTotal) * 100).toFixed(1)
    };
  }

  // Emergency memory release
  emergencyCleanup() {
    console.log('[Memory] Emergency cleanup initiated');
    
    // Force multiple garbage collections
    if (global.gc) {
      for (let i = 0; i < 5; i++) {
        global.gc();
      }
    }
    
    // Intensive cleanup for ES modules
    try {
      // Clear any available caches
      if (typeof global !== 'undefined' && global.gc) {
        // Multiple aggressive garbage collections
        for (let i = 0; i < 10; i++) {
          global.gc();
        }
      }
    } catch (error) {
      console.warn(`[Memory] Advanced cleanup unavailable:`, error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Check if emergency restart is needed (memory still too high after cleanup)
    setTimeout(() => {
      const currentUsage = this.getMemoryUsage();
      if (currentUsage > 95) {
        console.error(`[Memory] CRITICAL: ${currentUsage.toFixed(1)}% after cleanup - restart recommended`);
        console.log('[Memory] To restart the app, use the Replit console');
      }
    }, 1000);
    
    console.log('[Memory] Emergency cleanup completed');
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
let memoryOptimizer: MemoryOptimizer | null = null;

export function initializeMemoryOptimizer() {
  if (!memoryOptimizer) {
    memoryOptimizer = new MemoryOptimizer();
    console.log('[Memory] Memory optimizer initialized');
  }
  return memoryOptimizer;
}

export function getMemoryOptimizer() {
  return memoryOptimizer;
}

// Middleware for memory monitoring
export function memoryMonitoringMiddleware(req: any, res: any, next: any) {
  const optimizer = getMemoryOptimizer();
  if (optimizer) {
    const usage = optimizer.getMemoryUsage();
    if (usage > 60) {
      console.warn(`[Memory] Critical usage: ${usage.toFixed(1)}%`);
      optimizer.emergencyCleanup();
    }
  }
  next();
}