// ABSOLUTE MINIMAL SERVER - Zero imports test
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/api/health') {
    const mem = process.memoryUsage();
    const health = {
      status: 'minimal-test',
      heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      usage: Math.round((mem.heapUsed / mem.heapTotal) * 100) + '%',
      uptime: Math.floor(process.uptime()) + 's'
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('MINIMAL TEST SERVER - No imports, no memory leak');
  }
});

const port = process.env.PORT || 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`MINIMAL TEST: Server running on port ${port}`);
  console.log('Memory at startup:', process.memoryUsage());
});

// Single memory log every 30 seconds
setInterval(() => {
  const mem = process.memoryUsage();
  console.log('Memory check:', {
    heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
    usage: Math.round((mem.heapUsed / mem.heapTotal) * 100) + '%'
  });
}, 30000);