// Full application server with optimized memory management
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import services and routes
import { setupVite, serveStatic } from './vite.js';
import './db.js'; // Initialize database
import { registerRoutes } from './routes.js';

async function createApp() {
  const app = express();

  // Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.REPLIT_DEV_DOMAIN, process.env.REPL_SLUG + '.replit.app']
    : true,
  credentials: true
}));

app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
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
    version: '1.0.0'
  };
  
  res.json(health);
});

// Initialize routes
await registerRoutes(app);

  const server = createServer(app);
  
  // Serve static files and handle client-side routing
  if (process.env.NODE_ENV === 'production') {
    // Serve static files from dist/public
    app.use(express.static('dist/public'));
    
    // Handle client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/public/index.html'));
    });
  } else {
    // Use Vite middleware in development
    await setupVite(app, server);
  }

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message 
    });
  });

  return { app, server };
}

// Start the server
const startServer = async () => {
  const { app, server } = await createApp();
  const port = parseInt(process.env.PORT || '5000', 10);

  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ FinLearn server running on 0.0.0.0:${port}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Memory monitoring (every 2 minutes in production, every minute in development)
    const interval = process.env.NODE_ENV === 'production' ? 120000 : 60000;
    setInterval(() => {
      const mem = process.memoryUsage();
      console.log(`Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB (${Math.round((mem.heapUsed / mem.heapTotal) * 100)}%)`);
      
      // Force garbage collection if memory usage is high
      if (mem.heapUsed / mem.heapTotal > 0.85 && global.gc) {
        global.gc();
        console.log('🧹 Forced garbage collection');
      }
    }, interval);
  });
  
  return server;
};

// Start the application
startServer().catch(console.error);

export default startServer;