// EMERGENCY MEMORY SHUTDOWN - Kill all memory-intensive operations

import { performance } from 'perf_hooks';

class EmergencyMemoryShutdown {
  private static instance: EmergencyMemoryShutdown;
  private shutdownTriggered = false;
  private checkInterval: NodeJS.Timeout;

  private constructor() {
    console.log('[EMERGENCY] Memory shutdown system activated');
    
    // Check every 500ms for critical memory usage
    this.checkInterval = setInterval(() => {
      this.checkCriticalMemory();
    }, 500);
  }

  static getInstance(): EmergencyMemoryShutdown {
    if (!EmergencyMemoryShutdown.instance) {
      EmergencyMemoryShutdown.instance = new EmergencyMemoryShutdown();
    }
    return EmergencyMemoryShutdown.instance;
  }

  private checkCriticalMemory() {
    const memoryUsage = process.memoryUsage();
    const heapUsage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (heapUsage > 95 && !this.shutdownTriggered) {
      console.log('[EMERGENCY] CRITICAL MEMORY - Triggering emergency shutdown');
      this.emergencyShutdown();
      this.shutdownTriggered = true;
    } else if (heapUsage > 90) {
      // Immediate massive GC
      if (global.gc) {
        for (let i = 0; i < 200; i++) {
          global.gc();
        }
      }
      console.log('[EMERGENCY] High memory detected, aggressive cleanup performed');
    }
  }

  private emergencyShutdown() {
    console.log('[EMERGENCY] Performing emergency memory shutdown...');
    
    // Kill all intervals and timeouts safely
    const highestTimeoutId = setTimeout(() => {}, 0) as any;
    for (let i = 0; i < Number(highestTimeoutId); i++) {
      clearTimeout(i);
      clearInterval(i);
    }

    // Massive garbage collection
    if (global.gc) {
      for (let i = 0; i < 500; i++) {
        global.gc();
      }
    }

    // Force process to exit if still critical
    setTimeout(() => {
      const memUsage = process.memoryUsage();
      const heapUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      if (heapUsage > 98) {
        console.log('[EMERGENCY] Memory still critical, forcing process restart');
        process.exit(1);
      }
    }, 2000);
  }

  destroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
  }
}

// Activate immediately
EmergencyMemoryShutdown.getInstance();

export { EmergencyMemoryShutdown };