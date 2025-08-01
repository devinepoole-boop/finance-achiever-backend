import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/simple-schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool configuration
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  min: 2,  // Minimum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Database instance with optimized configuration
export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development' ? true : false,
});

// Connection monitoring
pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await pool.end();
  process.exit(0);
});

export { pool };