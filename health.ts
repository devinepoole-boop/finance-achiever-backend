
// Health check endpoint for deployment monitoring
export function createHealthCheck() {
  return (req, res) => {
    const memoryUsage = process.memoryUsage();
    const heapUsage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsage: Math.round(heapUsage * 100) / 100
      },
      environment: process.env.NODE_ENV || 'development'
    };
    
    if (heapUsage > 90) {
      health.status = 'warning';
      health.warning = 'High memory usage detected';
    }
    
    res.json(health);
  };
}
