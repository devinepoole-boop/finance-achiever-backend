// CLEAN SERVER - No memory leaking imports
import express from 'express';
import { createServer } from 'http';

const app = express();

// Essential middleware only
app.use(express.json({ limit: '1mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsage: Math.round((mem.heapUsed / mem.heapTotal) * 100 * 100) / 100,
      rss: Math.round(mem.rss / 1024 / 1024)
    },
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0-clean'
  };
  
  res.json(health);
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('FinLearn Server - Clean Mode (No Memory Leaks)');
});

// Basic error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

const server = createServer(app);

const port = parseInt(process.env.PORT || '5000', 10);
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Clean server running on 0.0.0.0:${port}`);
  console.log('✅ No memory leaking imports loaded');
  
  // Single memory check every 60 seconds (not aggressive)
  setInterval(() => {
    const mem = process.memoryUsage();
    console.log(`Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB (${Math.round((mem.heapUsed / mem.heapTotal) * 100)}%)`);
  }, 60000);
});

export default server;