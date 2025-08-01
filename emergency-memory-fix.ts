// Emergency memory leak fix - aggressive process management
import { performance } from 'perf_hooks';

// Critical memory management for deployment
export class EmergencyMemoryManager {
  private static instance: EmergencyMemoryManager;
  private intervalId: NodeJS.Timeout;
  private processStartTime = performance.now();

  private constructor() {
    // Ultra-aggressive cleanup every 3 seconds
    this.intervalId = setInterval(() => {
      this.emergencyCleanup();
    }, 3000);

    console.log('[Emergency] Memory manager activated');
  }

  static getInstance(): EmergencyMemoryManager {
    if (!EmergencyMemoryManager.instance) {
      EmergencyMemoryManager.instance = new EmergencyMemoryManager();
    }
    return EmergencyMemoryManager.instance;
  }

  private emergencyCleanup() {
    const memoryUsage = process.memoryUsage();
    const heapUsage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (heapUsage > 85) {
      console.log(`[Emergency] Critical memory: ${heapUsage.toFixed(1)}% - forcing cleanup`);
      
      // Ultra-aggressive garbage collection
      if (global.gc) {
        for (let i = 0; i < 15; i++) {
          global.gc();
        }
      }

      // Clear any possible cached modules (commented out for ES modules)
      // Note: require.cache not available in ES modules

      // Force V8 to reclaim memory
      if (global.gc) {
        global.gc();
        global.gc();
        global.gc();
      }

      console.log(`[Emergency] Cleanup completed`);
    }

    // If memory is still critical after 30 seconds, suggest restart
    const runtimeSeconds = (performance.now() - this.processStartTime) / 1000;
    if (heapUsage > 95 && runtimeSeconds > 30) {
      console.error(`[Emergency] CRITICAL: ${heapUsage.toFixed(1)}% memory after ${runtimeSeconds.toFixed(0)}s - restart recommended`);
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Auto-initialize
EmergencyMemoryManager.getInstance();