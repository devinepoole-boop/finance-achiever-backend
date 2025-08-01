import cron from 'node-cron';
import { storage } from './storage';
import { CacheInvalidation } from './cache';

// Background job queue interface
interface Job {
  id: string;
  type: string;
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt?: Date;
}

// Simple in-memory job queue (can be replaced with Redis Queue in production)
class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private processing = false;
  private maxJobs = 50; // Limit concurrent jobs to prevent memory buildup
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup completed jobs every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupCompletedJobs();
    }, 60 * 1000);
  }

  private cleanupCompletedJobs() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    let deleted = 0;
    this.jobs.forEach((job, id) => {
      if (job.createdAt.getTime() < oneHourAgo) {
        this.jobs.delete(id);
        deleted++;
      }
    });
    
    if (deleted > 0) {
      console.log(`[Jobs] Cleaned up ${deleted} old jobs, ${this.jobs.size} remaining`);
    }
  }
  
  async add(type: string, data: any, options: { 
    priority?: number; 
    delay?: number; 
    maxAttempts?: number 
  } = {}) {
    // Prevent job queue overflow
    if (this.jobs.size >= this.maxJobs) {
      console.warn(`[Jobs] Queue full (${this.jobs.size}), rejecting job: ${type}`);
      return null;
    }
    const job: Job = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
      scheduledAt: options.delay ? new Date(Date.now() + options.delay) : undefined,
    };
    
    this.jobs.set(job.id, job);
    console.log(`Job queued: ${job.type} (${job.id})`);
    
    if (!this.processing) {
      this.processJobs();
    }
    
    return job.id;
  }
  
  private async processJobs() {
    if (this.processing) return;
    this.processing = true;
    
    while (this.jobs.size > 0) {
      const readyJobs = Array.from(this.jobs.values())
        .filter(job => !job.scheduledAt || job.scheduledAt <= new Date())
        .sort((a, b) => b.priority - a.priority);
      
      if (readyJobs.length === 0) {
        // Wait for scheduled jobs
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      const job = readyJobs[0];
      await this.executeJob(job);
    }
    
    this.processing = false;
  }
  
  private async executeJob(job: Job) {
    try {
      console.log(`Processing job: ${job.type} (${job.id})`);
      job.attempts++;
      
      switch (job.type) {
        case 'update_user_statistics':
          await this.updateUserStatistics(job.data);
          break;
        case 'calculate_analytics':
          await this.calculateAnalytics(job.data);
          break;
        case 'cleanup_cache':
          await this.cleanupCache(job.data);
          break;
        case 'generate_credit_report':
          await this.generateCreditReport(job.data);
          break;
        case 'send_notifications':
          await this.sendNotifications(job.data);
          break;
        case 'update_investment_prices':
          await this.updateInvestmentPrices(job.data);
          break;
        default:
          console.warn(`Unknown job type: ${job.type}`);
      }
      
      this.jobs.delete(job.id);
      console.log(`Job completed: ${job.type} (${job.id})`);
      
    } catch (error) {
      console.error(`Job failed: ${job.type} (${job.id}):`, error);
      
      if (job.attempts >= job.maxAttempts) {
        console.error(`Job exhausted retries: ${job.type} (${job.id})`);
        this.jobs.delete(job.id);
      } else {
        // Exponential backoff for retry
        const delay = Math.pow(2, job.attempts) * 1000;
        job.scheduledAt = new Date(Date.now() + delay);
        console.log(`Job retry scheduled in ${delay}ms: ${job.type} (${job.id})`);
      }
    }
  }
  
  // Job implementations
  private async updateUserStatistics(data: { userId: string }) {
    const { userId } = data;
    
    // Calculate courses completed
    const progress = await storage.getUserProgress(userId);
    const completedCourses = progress.filter(p => p.completed).length;
    
    // Calculate communities joined
    const memberships = await storage.getUserCommunityMemberships(userId);
    const communitiesJoined = memberships.length;
    
    // Update user statistics
    await storage.updateUserStatistics(userId, {
      coursesCompleted: completedCourses,
      communitiesJoined: communitiesJoined,
    });
    
    // Invalidate user cache
    await CacheInvalidation.user(userId);
  }
  
  private async calculateAnalytics(data: { userId?: string; type: string }) {
    const { userId, type } = data;
    
    switch (type) {
      case 'learning_progress':
        if (userId) {
          const analytics = await storage.calculateLearningAnalytics(userId);
          await storage.cacheAnalytics(userId, analytics);
        }
        break;
      case 'financial_insights':
        if (userId) {
          const insights = await storage.calculateFinancialInsights(userId);
          await storage.cacheFinancialInsights(userId, insights);
        }
        break;
      case 'platform_metrics':
        const metrics = await storage.calculatePlatformMetrics();
        await storage.cachePlatformMetrics(metrics);
        break;
    }
  }
  
  private async cleanupCache(data: { pattern?: string }) {
    const { pattern } = data;
    console.log(`Running cache cleanup${pattern ? ` for pattern: ${pattern}` : ''}`);
    
    if (!pattern) {
      // General cleanup of expired cache entries
      // This would be implemented based on cache adapter
    }
  }
  
  private async generateCreditReport(data: { userId: string; bureau: string }) {
    const { userId, bureau } = data;
    console.log(`Generating credit report for user ${userId} from ${bureau}`);
    
    // Simulate credit report generation
    // In production, this would integrate with credit bureau APIs
    const mockReport = {
      userId,
      bureau,
      creditScore: 700 + Math.floor(Math.random() * 150),
      reportDate: new Date(),
      accounts: [],
      inquiries: [],
      publicRecords: [],
    };
    
    await storage.saveCreditReport(userId, bureau, mockReport);
  }
  
  private async sendNotifications(data: { 
    userId: string; 
    type: string; 
    message: string; 
    priority: string 
  }) {
    const { userId, type, message, priority } = data;
    console.log(`Sending ${type} notification to user ${userId}: ${message}`);
    
    // In production, this would integrate with notification services
    // For now, we'll just log and store in database
    await storage.createNotification({
      userId,
      type,
      message,
      priority,
      isRead: false,
    });
  }
  
  private async updateInvestmentPrices(data: { symbols?: string[] }) {
    const { symbols } = data;
    console.log(`Updating investment prices${symbols ? ` for symbols: ${symbols.join(', ')}` : ''}`);
    
    // Simulate price updates
    // In production, this would integrate with financial data APIs
    const investments = await storage.getAllInvestments(symbols);
    
    for (const investment of investments) {
      // Simulate price change
      const priceChange = (Math.random() - 0.5) * 0.1; // ±5% max change
      const newPrice = Math.max(1, investment.currentPrice * (1 + priceChange));
      
      await storage.updateInvestmentPrice(investment.id, Math.round(newPrice));
    }
  }
}

// Global job queue instance
export const jobQueue = new JobQueue();

// Scheduled jobs using cron
export function initializeScheduledJobs() {
  console.log('Initializing scheduled background jobs...');
  
  // Update platform analytics every hour
  cron.schedule('0 * * * *', async () => {
    await jobQueue.add('calculate_analytics', { type: 'platform_metrics' });
  });
  
  // Update investment prices every 15 minutes during market hours
  cron.schedule('*/15 9-16 * * 1-5', async () => {
    await jobQueue.add('update_investment_prices', {});
  });
  
  // Cleanup cache every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    await jobQueue.add('cleanup_cache', {});
  });
  
  // Generate daily analytics reports at midnight
  cron.schedule('0 0 * * *', async () => {
    const users = await storage.getAllActiveUsers();
    for (const user of users) {
      await jobQueue.add('calculate_analytics', { 
        userId: user.id, 
        type: 'learning_progress' 
      }, { priority: 1 });
      
      await jobQueue.add('calculate_analytics', { 
        userId: user.id, 
        type: 'financial_insights' 
      }, { priority: 1 });
    }
  });
  
  // Update user statistics every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    const activeUsers = await storage.getRecentlyActiveUsers();
    for (const user of activeUsers) {
      await jobQueue.add('update_user_statistics', { userId: user.id });
    }
  });
  
  console.log('Scheduled jobs initialized successfully');
}

// Utility functions for adding jobs
export const Jobs = {
  updateUserStats: (userId: string) => 
    jobQueue.add('update_user_statistics', { userId }),
    
  calculateUserAnalytics: (userId: string, type: string) =>
    jobQueue.add('calculate_analytics', { userId, type }),
    
  generateCreditReport: (userId: string, bureau: string) =>
    jobQueue.add('generate_credit_report', { userId, bureau }, { priority: 5 }),
    
  sendNotification: (userId: string, type: string, message: string, priority = 'medium') =>
    jobQueue.add('send_notifications', { userId, type, message, priority }),
    
  updateInvestmentPrices: (symbols?: string[]) =>
    jobQueue.add('update_investment_prices', { symbols }),
};