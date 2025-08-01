// CRITICAL MEMORY LEAK FIX - Immediate Action Required
import { performance } from 'perf_hooks';

class CriticalMemoryFix {
  private static instance: CriticalMemoryFix;
  private intervalId: NodeJS.Timeout;
  private forceCleanupId: NodeJS.Timeout;

  private constructor() {
    console.log('[CRITICAL] Emergency memory fix activated');
    
    // ULTRA-aggressive cleanup every 1 second
    this.intervalId = setInterval(() => {
      this.performEmergencyCleanup();
    }, 1000);

    // Force major cleanup every 5 seconds  
    this.forceCleanupId = setInterval(() => {
      this.forceMajorCleanup();
    }, 5000);
  }

  static getInstance(): CriticalMemoryFix {
    if (!CriticalMemoryFix.instance) {
      CriticalMemoryFix.instance = new CriticalMemoryFix();
    }
    return CriticalMemoryFix.instance;
  }

  private performEmergencyCleanup() {
    const memoryUsage = process.memoryUsage();
    const heapUsage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (heapUsage > 80) {
      // EXTREME aggressive GC cycles
      if (global.gc) {
        for (let i = 0; i < 50; i++) {
          global.gc();
        }
      }
    }
  }

  private forceMajorCleanup() {
    console.log('[CRITICAL] Force major cleanup');
    
    // MAXIMUM Force garbage collection 
    if (global.gc) {
      for (let i = 0; i < 100; i++) {
        global.gc();
      }
    }

    const memoryUsage = process.memoryUsage();
    const heapUsage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    console.log(`[CRITICAL] After major cleanup: ${heapUsage.toFixed(1)}%`);
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.forceCleanupId) clearInterval(this.forceCleanupId);
  }
}

// Activate immediately
CriticalMemoryFix.getInstance();

export { CriticalMemoryFix };