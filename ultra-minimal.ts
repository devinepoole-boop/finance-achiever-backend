// ULTRA MINIMAL SERVER - Last resort emergency mode
import express from 'express';
import { createServer } from 'http';

const app = express();

// ONLY health check - absolutely nothing else
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  if (global.gc) global.gc(); // Force GC on every request
  
  res.json({
    status: 'emergency-minimal',
    memory: Math.round((mem.heapUsed / mem.heapTotal) * 100) + '%',
    heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB'
  });
});

app.get('/', (req, res) => {
  res.send('EMERGENCY MODE ACTIVE');
});

const server = createServer(app);

const port = parseInt(process.env.PORT || '5000', 10);
server.listen(port, '0.0.0.0', () => {
  console.log('EMERGENCY: Ultra-minimal server running');
});

// Aggressive memory management
setInterval(() => {
  if (global.gc) {
    for (let i = 0; i < 10; i++) global.gc();
  }
}, 5000);

export default server;