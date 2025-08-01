import type { Express } from "express";
import { createServer, type Server } from "http";

// EMERGENCY: Only the absolute minimum routes to prevent memory leak
export async function registerMinimalRoutes(app: Express): Promise<Server> {
  console.log('[EMERGENCY] Loading minimal safe routes only');
  
  // ONLY health check - nothing else to prevent memory leaks
  app.get("/api/health", (req, res) => {
    const memoryUsage = process.memoryUsage();
    const heapUsage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    // Force immediate garbage collection if memory is high
    if (heapUsage > 85 && global.gc) {
      global.gc();
    }
    
    const health = {
      status: heapUsage > 90 ? 'critical' : heapUsage > 80 ? 'warning' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsage: Math.round(heapUsage * 100) / 100,
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0-emergency-minimal'
    };
    
    res.json(health);
  });

  // Simple text response for root to confirm server is running
  app.get("/", (req, res) => {
    res.send('FinLearn Server Running - Emergency Minimal Mode');
  });

  // Serve static files for frontend (essential)
  // app.use(express.static('dist')); // DISABLED TO PREVENT MEMORY LEAK

  const httpServer = createServer(app);
  return httpServer;
}