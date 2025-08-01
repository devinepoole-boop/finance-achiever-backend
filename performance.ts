import { performance } from 'perf_hooks';

// Performance monitoring and profiling utilities
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  category: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeTimers = new Map<string, number>();
  private maxMetrics = 20; // Severely reduced for deployment memory optimization
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Run cleanup every 30 seconds for deployment
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30 * 1000);
  }

  // Cleanup old metrics and timers
  private cleanup() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Remove metrics older than 1 hour
    this.metrics = this.metrics.filter(metric => metric.timestamp > oneHourAgo);
    
    // Clear stuck timers older than 10 minutes
    const tenMinutesAgo = performance.now() - (10 * 60 * 1000);
    this.activeTimers.forEach((startTime, timerId) => {
      if (startTime < tenMinutesAgo) {
        this.activeTimers.delete(timerId);
      }
    });
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  // Destroy the monitor and cleanup resources
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.metrics = [];
    this.activeTimers.clear();
  }

  // Start timing a operation
  startTimer(name: string, category = 'general', metadata?: Record<string, any>) {
    const startTime = performance.now();
    const timerId = `${name}_${startTime}_${Math.random()}`;
    this.activeTimers.set(timerId, startTime);
    
    return {
      timerId,
      end: () => this.endTimer(timerId, name, category, metadata),
    };
  }

  // End timing and record metric
  private endTimer(timerId: string, name: string, category: string, metadata?: Record<string, any>) {
    const startTime = this.activeTimers.get(timerId);
    if (!startTime) {
      console.warn(`Timer not found: ${timerId}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.activeTimers.delete(timerId);

    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      category,
      metadata,
    });

    return duration;
  }

  // Record a performance metric
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.splice(0, this.metrics.length - this.maxMetrics);
    }

    // Log slow operations
    if (metric.duration > 1000) { // > 1 second
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  // Get performance statistics
  getStats(category?: string, timeRange?: number) {
    let filteredMetrics = this.metrics;
    
    if (category) {
      filteredMetrics = filteredMetrics.filter(m => m.category === category);
    }
    
    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      filteredMetrics = filteredMetrics.filter(m => m.timestamp > cutoff);
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map(m => m.duration);
    const sorted = durations.sort((a, b) => a - b);
    
    return {
      count: filteredMetrics.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      slowest: filteredMetrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(m => ({ name: m.name, duration: m.duration, metadata: m.metadata })),
    };
  }

  // Get real-time metrics for monitoring dashboard
  getRealTimeMetrics() {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    return {
      database: this.getStats('database', fiveMinutesAgo),
      api: this.getStats('api', fiveMinutesAgo),
      cache: this.getStats('cache', fiveMinutesAgo),
      background_jobs: this.getStats('background_jobs', fiveMinutesAgo),
      memory: this.getMemoryUsage(),
      activeConnections: this.activeTimers.size,
    };
  }

  // Memory usage monitoring
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapUsage: (usage.heapUsed / usage.heapTotal * 100).toFixed(1), // %
    };
  }

  // Clear old metrics
  clearMetrics(olderThanMs?: number) {
    if (olderThanMs) {
      const cutoff = Date.now() - olderThanMs;
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    } else {
      this.metrics = [];
    }
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// Middleware for Express route performance monitoring
export function performanceMiddleware(req: any, res: any, next: any) {
  const timer = perfMonitor.startTimer(
    `${req.method} ${req.route?.path || req.path}`,
    'api',
    {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    }
  );

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    timer.end();
    originalEnd.apply(this, args);
  };

  next();
}

// Database query performance wrapper
export function withDatabasePerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const timer = perfMonitor.startTimer(queryName, 'database', metadata);
  
  return queryFn()
    .then(result => {
      timer.end();
      return result;
    })
    .catch(error => {
      timer.end();
      throw error;
    });
}

// Cache operation performance wrapper
export function withCachePerformance<T>(
  operation: string,
  cacheFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const timer = perfMonitor.startTimer(`cache_${operation}`, 'cache', metadata);
  
  return cacheFn()
    .then(result => {
      timer.end();
      return result;
    })
    .catch(error => {
      timer.end();
      throw error;
    });
}

// Background job performance wrapper
export function withJobPerformance<T>(
  jobName: string,
  jobFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const timer = perfMonitor.startTimer(jobName, 'background_jobs', metadata);
  
  return jobFn()
    .then(result => {
      timer.end();
      return result;
    })
    .catch(error => {
      timer.end();
      throw error;
    });
}

// Memory usage alerts
export function monitorMemoryUsage() {
  setInterval(() => {
    const usage = perfMonitor.getMemoryUsage();
    
    // Alert if heap usage is over 80%
    if (parseFloat(usage.heapUsage) > 80) {
      console.warn(`High memory usage detected: ${usage.heapUsage}% heap used`);
    }
    
    // Alert if RSS is over 500MB
    if (usage.rss > 500) {
      console.warn(`High RSS memory usage: ${usage.rss}MB`);
    }
  }, 30000); // Check every 30 seconds
}

// Performance report generator
export function generatePerformanceReport(timeRangeMs = 3600000) { // 1 hour default
  const report = {
    timestamp: new Date().toISOString(),
    timeRange: `${timeRangeMs / 1000 / 60} minutes`,
    memory: perfMonitor.getMemoryUsage(),
    categories: {
      database: perfMonitor.getStats('database', timeRangeMs),
      api: perfMonitor.getStats('api', timeRangeMs),
      cache: perfMonitor.getStats('cache', timeRangeMs),
      background_jobs: perfMonitor.getStats('background_jobs', timeRangeMs),
    },
    recommendations: [] as string[],
  };

  // Generate recommendations based on metrics
  if (report.categories.database?.avg && report.categories.database.avg > 500) {
    report.recommendations.push('Consider optimizing database queries - average response time is high');
  }
  
  if (report.categories.api?.p95 && report.categories.api.p95 > 2000) {
    report.recommendations.push('API response times are slow - consider caching or optimization');
  }
  
  if (parseFloat(report.memory.heapUsage) > 70) {
    report.recommendations.push('Memory usage is high - consider garbage collection optimization');
  }

  return report;
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  console.log('Initializing performance monitoring...');
  
  // Start memory monitoring
  monitorMemoryUsage();
  
  // Clear old metrics every hour
  setInterval(() => {
    perfMonitor.clearMetrics(3600000); // Clear metrics older than 1 hour
  }, 3600000);
  
  // Generate performance reports every 15 minutes in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const report = generatePerformanceReport(900000); // Last 15 minutes
      console.log('Performance Report:', JSON.stringify(report, null, 2));
    }, 900000);
  }
  
  console.log('Performance monitoring initialized');
}