import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiTutorService } from "./services/openai";
import { db } from "./db";
import { posts, users } from "@shared/simple-schema";
import { eq, desc, sql } from "drizzle-orm";
import { storage } from "./simple-storage";
import { createSubscription, createCustomer, stripe, PRICING_PLANS } from "./stripe";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static HTML video players and test pages before other middleware
  app.get('/*-player.html', (req, res) => {
    const fileName = path.basename(req.path);
    const filePath = path.resolve(process.cwd(), fileName);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Video player not found');
    }
  });

  app.get('/test-payment.html', (req, res) => {
    const filePath = path.resolve(process.cwd(), 'test-payment.html');
    res.sendFile(filePath);
  });

  await setupAuth(app);

  // Temporary test user endpoint for custom domain
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // For custom domain testing, provide a test user
      if (req.hostname === 'financeachiever.net') {
        res.json({
          id: 'test-user-1',
          email: 'demo@financeachiever.net',
          firstName: 'Demo',
          lastName: 'User',
        });
      } else {
        // Use normal authentication for Replit domains
        return isAuthenticated(req, res, () => {
          const claims = req.user.claims;
          res.json({
            id: claims.sub,
            email: claims.email,
            firstName: claims.first_name,
            lastName: claims.last_name,
          });
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await aiTutorService.generateResponse(message);
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ 
        message: "AI service unavailable. Please check your OpenAI API key.",
        error: error.message 
      });
    }
  });

  // Social Media Posts Routes with pagination
  app.get("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Max 50 posts per request
      const offset = (page - 1) * limit;
      
      const allPosts = await storage.getPosts(limit, offset);
      res.json(allPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const { content } = req.body;
      const userId = req.user.claims.sub;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required" });
      }

      // Create post directly to handle database schema mismatch
      const result = await db.execute(sql`
        INSERT INTO posts (content, user_id, community_id) 
        VALUES (${content}, ${userId}, 1) 
        RETURNING *
      `);
      const newPost = result.rows[0];

      res.json(newPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post("/api/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedPost = await storage.likePost(id);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.get("/api/profile/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const userPosts = await db
        .select({ count: posts.id })
        .from(posts)
        .where(eq(posts.authorId, userId));

      res.json({
        postsCount: userPosts.length,
        aiChatsCount: 0 // Simplified for now
      });
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ message: "Failed to fetch profile stats" });
    }
  });

  // Stripe Payment Routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const { planId } = req.body;
      const claims = req.user.claims;
      
      const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
      if (!plan) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      // Create or get customer
      let customerId = null;
      try {
        const customer = await createCustomer(
          claims.email, 
          `${claims.first_name} ${claims.last_name}`
        );
        customerId = customer.id;
      } catch (error) {
        console.error("Error creating customer:", error);
        return res.status(500).json({ message: "Failed to create customer" });
      }

      // Create subscription
      const subscription = await createSubscription(customerId, planId);
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        customerId
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post("/api/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const { planId, subscriptionId } = req.body;
      const userId = req.user.claims.sub;

      // Update user subscription in database
      const result = await db.execute(sql`
        UPDATE users 
        SET subscription = ${planId}, 
            stripe_subscription_id = ${subscriptionId},
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "Subscription activated successfully",
        subscription: planId,
        user: result.rows[0]
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Health check endpoint for deployment monitoring
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
        heapUsage: Math.round(heapUsage * 100) / 100
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0-memory-optimized'
    };
    
    res.json(health);
  });

  app.get("/api/subscription/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const result = await db.execute(sql`
        SELECT subscription 
        FROM users 
        WHERE id = ${userId}
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = result.rows[0] as any;
      const subscription = (user.subscription as string) || 'free';
      res.json({ 
        subscription: subscription,
        hasAccess: {
          courses: ['courses', 'bundle'].includes(subscription),
          aiTutor: ['ai-tutor', 'bundle'].includes(subscription),
          social: true // Always available
        }
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}