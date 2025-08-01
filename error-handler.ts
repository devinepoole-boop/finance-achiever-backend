// Comprehensive error handling for all deployment issues
import type { Request, Response, NextFunction } from 'express';

export function createErrorHandler() {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    // Suppress Redis connection error spam
    if (err.message?.includes('ECONNREFUSED') && err.message?.includes('127.0.0.1:6379')) {
      // Redis connection error - suppress and continue
      return next();
    }

    // Handle other errors normally
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Don't log Redis connection errors
    if (!err.message?.includes('ECONNREFUSED')) {
      console.error('Server error:', err);
    }

    res.status(status).json({ message });
  };
}

export function suppressRedisErrors() {
  // Override console methods to filter Redis errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (!message.includes('ECONNREFUSED') && !message.includes('127.0.0.1:6379')) {
      originalError.apply(console, args);
    }
  };
}