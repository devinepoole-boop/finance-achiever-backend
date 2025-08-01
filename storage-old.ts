import { 
  type User, type InsertUser, type UpsertUser,
  type Community, type InsertCommunity,
  type Post, type InsertPost, type PostWithAuthor,
  type Course, type InsertCourse, type CourseWithProgress,
  type UserProgress, type InsertUserProgress,
  type AiConversation, type InsertAiConversation,
  type CommunityWithMembership,
  type FinancialAccount, type InsertFinancialAccount,
  type Transaction, type InsertTransaction,
  type Budget, type InsertBudget,
  type FinancialGoal, type InsertFinancialGoal,
  type Investment, type InsertInvestment,
  type CreditReport, type InsertCreditReport,
  type CreditAccount, type InsertCreditAccount,
  type CreditDispute, type InsertCreditDispute,
  type CreditMonitoring, type InsertCreditMonitoring,
  type BureauCommunication, type InsertBureauCommunication,
  users, communities, posts, courses, userProgress, postLikes, communityMembers, aiConversations,
  financialAccounts, transactions, budgets, financialGoals, investments,
  creditReports, creditAccounts, creditDisputes, creditMonitoring, bureauCommunications
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users (Updated for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Communities
  getCommunities(): Promise<CommunityWithMembership[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  joinCommunity(userId: string, communityId: string): Promise<void>;
  leaveCommunity(userId: string, communityId: string): Promise<void>;
  getUserCommunities(userId: string): Promise<Community[]>;

  // Posts
  getPosts(communityId?: string): Promise<PostWithAuthor[]>;
  getPost(id: string): Promise<PostWithAuthor | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;

  // Courses
  getCourses(): Promise<CourseWithProgress[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;

  // AI Conversations
  getAiConversation(userId: string, courseId?: string): Promise<AiConversation | undefined>;
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  updateAiConversation(id: string, messages: any[]): Promise<AiConversation>;

  // Financial Management
  getFinancialAccounts(userId: string): Promise<FinancialAccount[]>;
  createFinancialAccount(insertAccount: InsertFinancialAccount): Promise<FinancialAccount>;
  updateFinancialAccount(id: string, updates: Partial<FinancialAccount>): Promise<FinancialAccount>;
  deleteFinancialAccount(id: string): Promise<void>;

  getTransactions(userId: string, accountId?: string): Promise<Transaction[]>;
  createTransaction(insertTransaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  getBudgets(userId: string): Promise<Budget[]>;
  createBudget(insertBudget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, updates: Partial<Budget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;

  getFinancialGoals(userId: string): Promise<FinancialGoal[]>;
  createFinancialGoal(insertGoal: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal>;
  deleteFinancialGoal(id: string): Promise<void>;

  getInvestments(userId: string): Promise<Investment[]>;
  createInvestment(insertInvestment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment>;
  deleteInvestment(id: string): Promise<void>;

  // Credit Management
  getCreditReports(userId: string): Promise<CreditReport[]>;
  createCreditReport(insertReport: InsertCreditReport): Promise<CreditReport>;
  updateCreditReport(id: string, updates: Partial<CreditReport>): Promise<CreditReport>;
  deleteCreditReport(id: string): Promise<void>;

  getCreditAccounts(userId: string, reportId?: string): Promise<CreditAccount[]>;
  createCreditAccount(insertAccount: InsertCreditAccount): Promise<CreditAccount>;
  updateCreditAccount(id: string, updates: Partial<CreditAccount>): Promise<CreditAccount>;
  deleteCreditAccount(id: string): Promise<void>;

  getCreditDisputes(userId: string): Promise<CreditDispute[]>;
  createCreditDispute(insertDispute: InsertCreditDispute): Promise<CreditDispute>;
  updateCreditDispute(id: string, updates: Partial<CreditDispute>): Promise<CreditDispute>;
  deleteCreditDispute(id: string): Promise<void>;

  getCreditMonitoring(userId: string): Promise<CreditMonitoring[]>;
  createCreditMonitoring(insertMonitoring: InsertCreditMonitoring): Promise<CreditMonitoring>;
  markCreditAlertRead(id: string): Promise<void>;

  getBureauCommunications(userId: string, disputeId?: string): Promise<BureauCommunication[]>;
  createBureauCommunication(insertCommunication: InsertBureauCommunication): Promise<BureauCommunication>;
  updateBureauCommunication(id: string, updates: Partial<BureauCommunication>): Promise<BureauCommunication>;

  generateDisputeLetter(disputeType: string, disputeReason: string, method: string, accountInfo: any): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // Community operations
  async getCommunities(): Promise<CommunityWithMembership[]> {
    const allCommunities = await db.select().from(communities);
    return allCommunities.map(community => ({
      ...community,
      isMember: false, // Would check membership in real implementation
    }));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const [community] = await db
      .insert(communities)
      .values(insertCommunity)
      .returning();
    return community;
  }

  async joinCommunity(userId: string, communityId: string): Promise<void> {
    await db.insert(communityMembers).values({ userId, communityId });
    
    // Update member count
    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, communityId));
  }

  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    await db
      .delete(communityMembers)
      .where(and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, communityId)
      ));
    
    // Update member count
    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} - 1` })
      .where(eq(communities.id, communityId));
  }

  async getUserCommunities(userId: string): Promise<Community[]> {
    const userMemberships = await db
      .select({ community: communities })
      .from(communityMembers)
      .innerJoin(communities, eq(communityMembers.communityId, communities.id))
      .where(eq(communityMembers.userId, userId));
    
    return userMemberships.map(m => m.community);
  }

  // Post operations
  async getPosts(communityId?: string): Promise<PostWithAuthor[]> {
    const query = db
      .select({
        post: posts,
        author: users,
        community: communities,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .orderBy(desc(posts.createdAt));

    const result = communityId 
      ? await query.where(eq(posts.communityId, communityId))
      : await query;

    return result.map(({ post, author, community }) => ({
      ...post,
      author,
      community,
      isLiked: false, // Would check user likes in real implementation
    }));
  }

  async getPost(id: string): Promise<PostWithAuthor | undefined> {
    const [result] = await db
      .select({
        post: posts,
        author: users,
        community: communities,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .where(eq(posts.id, id));

    if (!result) return undefined;

    return {
      ...result.post,
      author: result.author,
      community: result.community,
      isLiked: false,
    };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async likePost(userId: string, postId: string): Promise<void> {
    await db.insert(postLikes).values({ userId, postId });
    
    // Update like count
    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId));
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db
      .delete(postLikes)
      .where(and(
        eq(postLikes.userId, userId),
        eq(postLikes.postId, postId)
      ));
    
    // Update like count
    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} - 1` })
      .where(eq(posts.id, postId));
  }

  // Course operations
  async getCourses(): Promise<CourseWithProgress[]> {
    const allCourses = await db.select().from(courses);
    return allCourses.map(course => ({
      ...course,
      progress: undefined, // Would join with user progress in real implementation
    }));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(insertCourse)
      .returning();
    return course;
  }

  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.courseId, courseId)
      ));
    return progress;
  }

  async updateUserProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    const [progress] = await db
      .insert(userProgress)
      .values(progressData)
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.courseId],
        set: {
          progress: progressData.progress,
          completed: progressData.completed,
          lastWatched: new Date(),
        },
      })
      .returning();
    return progress;
  }

  // AI Conversation operations
  async getAiConversation(userId: string, courseId?: string): Promise<AiConversation | undefined> {
    const query = db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId));

    const conversations = courseId 
      ? await query.where(eq(aiConversations.courseId, courseId))
      : await query;

    return conversations[0];
  }

  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [result] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();
    return result;
  }

  async updateAiConversation(id: string, messages: any[]): Promise<AiConversation> {
    const [conversation] = await db
      .update(aiConversations)
      .set({ messages })
      .where(eq(aiConversations.id, id))
      .returning();
    return conversation;
  }

  // Financial Management operations
  async getFinancialAccounts(userId: string): Promise<FinancialAccount[]> {
    return await db.select().from(financialAccounts).where(eq(financialAccounts.userId, userId));
  }

  async createFinancialAccount(insertAccount: InsertFinancialAccount): Promise<FinancialAccount> {
    const [account] = await db.insert(financialAccounts).values(insertAccount).returning();
    return account;
  }

  async updateFinancialAccount(id: string, updates: Partial<FinancialAccount>): Promise<FinancialAccount> {
    const [account] = await db.update(financialAccounts).set(updates).where(eq(financialAccounts.id, id)).returning();
    if (!account) throw new Error("Account not found");
    return account;
  }

  async deleteFinancialAccount(id: string): Promise<void> {
    await db.delete(financialAccounts).where(eq(financialAccounts.id, id));
  }

  async getTransactions(userId: string, accountId?: string): Promise<Transaction[]> {
    const query = db.select().from(transactions).where(eq(transactions.userId, userId));
    return accountId ? await query.where(eq(transactions.accountId, accountId)) : await query;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    if (!transaction) throw new Error("Transaction not found");
    return transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const [budget] = await db.insert(budgets).values(insertBudget).returning();
    return budget;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const [budget] = await db.update(budgets).set(updates).where(eq(budgets.id, id)).returning();
    if (!budget) throw new Error("Budget not found");
    return budget;
  }

  async deleteBudget(id: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    return await db.select().from(financialGoals).where(eq(financialGoals.userId, userId));
  }

  async createFinancialGoal(insertGoal: InsertFinancialGoal): Promise<FinancialGoal> {
    const [goal] = await db.insert(financialGoals).values(insertGoal).returning();
    return goal;
  }

  async updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const [goal] = await db.update(financialGoals).set(updates).where(eq(financialGoals.id, id)).returning();
    if (!goal) throw new Error("Goal not found");
    return goal;
  }

  async deleteFinancialGoal(id: string): Promise<void> {
    await db.delete(financialGoals).where(eq(financialGoals.id, id));
  }

  async getInvestments(userId: string): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.userId, userId));
  }

  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    const [investment] = await db.insert(investments).values(insertInvestment).returning();
    return investment;
  }

  async updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment> {
    const [investment] = await db.update(investments).set(updates).where(eq(investments.id, id)).returning();
    if (!investment) throw new Error("Investment not found");
    return investment;
  }

  async deleteInvestment(id: string): Promise<void> {
    await db.delete(investments).where(eq(investments.id, id));
  }

  // Credit Management operations
  async getCreditReports(userId: string): Promise<CreditReport[]> {
    return await db.select().from(creditReports).where(eq(creditReports.userId, userId));
  }

  async createCreditReport(insertReport: InsertCreditReport): Promise<CreditReport> {
    const [report] = await db.insert(creditReports).values(insertReport).returning();
    return report;
  }

  async updateCreditReport(id: string, updates: Partial<CreditReport>): Promise<CreditReport> {
    const [report] = await db.update(creditReports).set(updates).where(eq(creditReports.id, id)).returning();
    if (!report) throw new Error("Credit report not found");
    return report;
  }

  async deleteCreditReport(id: string): Promise<void> {
    await db.delete(creditReports).where(eq(creditReports.id, id));
  }

  async getCreditAccounts(userId: string, reportId?: string): Promise<CreditAccount[]> {
    const query = db.select().from(creditAccounts).where(eq(creditAccounts.userId, userId));
    return reportId ? await query.where(eq(creditAccounts.reportId, reportId)) : await query;
  }

  async createCreditAccount(insertAccount: InsertCreditAccount): Promise<CreditAccount> {
    const [account] = await db.insert(creditAccounts).values(insertAccount).returning();
    return account;
  }

  async updateCreditAccount(id: string, updates: Partial<CreditAccount>): Promise<CreditAccount> {
    const [account] = await db.update(creditAccounts).set(updates).where(eq(creditAccounts.id, id)).returning();
    if (!account) throw new Error("Credit account not found");
    return account;
  }

  async deleteCreditAccount(id: string): Promise<void> {
    await db.delete(creditAccounts).where(eq(creditAccounts.id, id));
  }

  async getCreditDisputes(userId: string): Promise<CreditDispute[]> {
    return await db.select().from(creditDisputes).where(eq(creditDisputes.userId, userId));
  }

  async createCreditDispute(insertDispute: InsertCreditDispute): Promise<CreditDispute> {
    const [dispute] = await db.insert(creditDisputes).values(insertDispute).returning();
    return dispute;
  }

  async updateCreditDispute(id: string, updates: Partial<CreditDispute>): Promise<CreditDispute> {
    const [dispute] = await db.update(creditDisputes).set(updates).where(eq(creditDisputes.id, id)).returning();
    if (!dispute) throw new Error("Credit dispute not found");
    return dispute;
  }

  async deleteCreditDispute(id: string): Promise<void> {
    await db.delete(creditDisputes).where(eq(creditDisputes.id, id));
  }

  async getCreditMonitoring(userId: string): Promise<CreditMonitoring[]> {
    return await db.select().from(creditMonitoring).where(eq(creditMonitoring.userId, userId));
  }

  async createCreditMonitoring(insertMonitoring: InsertCreditMonitoring): Promise<CreditMonitoring> {
    const [monitoring] = await db.insert(creditMonitoring).values(insertMonitoring).returning();
    return monitoring;
  }

  async markCreditAlertRead(id: string): Promise<void> {
    await db.update(creditMonitoring).set({ isRead: true }).where(eq(creditMonitoring.id, id));
  }

  async getBureauCommunications(userId: string, disputeId?: string): Promise<BureauCommunication[]> {
    const query = db.select().from(bureauCommunications).where(eq(bureauCommunications.userId, userId));
    return disputeId ? await query.where(eq(bureauCommunications.disputeId, disputeId)) : await query;
  }

  async createBureauCommunication(insertCommunication: InsertBureauCommunication): Promise<BureauCommunication> {
    const [communication] = await db.insert(bureauCommunications).values(insertCommunication).returning();
    return communication;
  }

  async updateBureauCommunication(id: string, updates: Partial<BureauCommunication>): Promise<BureauCommunication> {
    const [communication] = await db.update(bureauCommunications).set(updates).where(eq(bureauCommunications.id, id)).returning();
    if (!communication) throw new Error("Bureau communication not found");
    return communication;
  }

  async generateDisputeLetter(disputeType: string, disputeReason: string, method: string, accountInfo: any): Promise<string> {
    // This would generate dispute letters based on the type (Section 609, FCRA 623, etc.)
    const letters = {
      'section_609': `Dear Credit Bureau,\n\nI am writing to request verification of the following account under Section 609 of the Fair Credit Reporting Act...\n\nAccount: ${accountInfo.creditor}\nAccount Number: ${accountInfo.accountNumber}\n\nReason: ${disputeReason}\n\nPlease provide verification within 30 days.\n\nSincerely,\n[Your Name]`,
      'fcra_623': `Dear ${accountInfo.creditor},\n\nUnder Section 623 of the Fair Credit Reporting Act, I am disputing the accuracy of the following account...\n\nAccount: ${accountInfo.accountNumber}\nReason: ${disputeReason}\n\nPlease investigate and correct any inaccuracies.\n\nSincerely,\n[Your Name]`,
    };
    
    return letters[disputeType] || 'Template not found';
  }
}

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create sample user
    const user: User = {
      id: "user-1",
      email: "sarah@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      profileImageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      subscription: "pro",
      coursesCompleted: 12,
      communitiesJoined: 5,
      learningStreak: 23,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);

    // Create sample communities
    const communities: Community[] = [
      {
        id: "comm-1",
        name: "Stock Market Beginners",
        description: "Learn the basics of stock market investing",
        icon: "fas fa-chart-line",
        memberCount: 2300,
        createdBy: user.id,
        createdAt: new Date(),
      },
      {
        id: "comm-2", 
        name: "Personal Budgeting",
        description: "Master your personal finances",
        icon: "fas fa-piggy-bank",
        memberCount: 1800,
        createdBy: user.id,
        createdAt: new Date(),
      },
      {
        id: "comm-3",
        name: "Crypto Fundamentals", 
        description: "Understanding cryptocurrency basics",
        icon: "fas fa-coins",
        memberCount: 3100,
        createdBy: user.id,
        createdAt: new Date(),
      }
    ];
    communities.forEach(c => this.communities.set(c.id, c));

    // Create sample courses
    const courses: Course[] = [
      {
        id: "course-1",
        title: "Investment Fundamentals",
        description: "Learn the basics of investing and building wealth",
        instructor: "Dr. Patricia Kim",
        thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        videoUrl: "https://example.com/video1.mp4",
        duration: "25:30",
        rating: "4.8",
        reviewCount: 1240,
        price: 0,
        isPremium: false,
        createdAt: new Date(),
      },
      {
        id: "course-2",
        title: "Real Estate Investing 101",
        description: "Complete guide to real estate investment",
        instructor: "Sarah Williams",
        thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        videoUrl: "https://example.com/video2.mp4",
        duration: "18:45",
        rating: "4.6",
        reviewCount: 892,
        price: 4900,
        isPremium: true,
        createdAt: new Date(),
      }
    ];
    courses.forEach(c => this.courses.set(c.id, c));

    // User progress for current course
    const progress: UserProgress = {
      id: "progress-1",
      userId: user.id,
      courseId: "course-1",
      progress: 68,
      completed: false,
      lastWatched: new Date(),
    };
    this.userProgress.set(`${user.id}-${progress.courseId}`, progress);

    // Create sample posts
    const posts: Post[] = [
      {
        id: "post-1",
        content: "Just finished learning about compound interest and I'm blown away! 💰 Starting my investment journey with a small amount each month. The key is consistency, not the amount you start with. #FinancialLiteracy",
        imageUrl: null,
        videoUrl: null,
        authorId: user.id,
        communityId: "comm-1",
        likes: 24,
        comments: 8,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: "post-2",
        content: "Quick tip: Before investing in anything, make sure you have an emergency fund covering 3-6 months of expenses. It's not exciting, but it's the foundation of good financial health! 🏦",
        imageUrl: null,
        videoUrl: null,
        authorId: user.id,
        communityId: "comm-2",
        likes: 18,
        comments: 5,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
      {
        id: "post-3",
        content: "The best investment you can make is in yourself - education, skills, and knowledge. Just completed another course on portfolio diversification. Knowledge compounds just like money! 📚",
        imageUrl: null,
        videoUrl: null,
        authorId: user.id,
        communityId: null,
        likes: 31,
        comments: 12,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      }
    ];
    posts.forEach(p => this.posts.set(p.id, p));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    if (existingUser) {
      const updated = { ...existingUser, ...userData, updatedAt: new Date() };
      this.users.set(userData.id!, updated);
      return updated;
    } else {
      const newUser: User = {
        ...userData,
        id: userData.id || randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      avatar: insertUser.avatar || null,
      title: insertUser.title || null,
      coursesCompleted: 0,
      communitiesJoined: 0,
      learningStreak: 0,
      subscription: "free",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getCommunities(): Promise<CommunityWithMembership[]> {
    return Array.from(this.communities.values()).map(community => ({
      ...community,
      isMember: false, // Would check membership in real implementation
    }));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const id = randomUUID();
    const community: Community = {
      ...insertCommunity,
      id,
      description: insertCommunity.description || null,
      memberCount: 1,
      createdAt: new Date(),
    };
    this.communities.set(id, community);
    return community;
  }

  async joinCommunity(userId: string, communityId: string): Promise<void> {
    const membershipId = randomUUID();
    this.communityMembers.set(membershipId, { userId, communityId });
    
    const community = this.communities.get(communityId);
    if (community) {
      community.memberCount += 1;
      this.communities.set(communityId, community);
    }
  }

  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    const membership = Array.from(this.communityMembers.entries())
      .find(([_, m]) => m.userId === userId && m.communityId === communityId);
    
    if (membership) {
      this.communityMembers.delete(membership[0]);
      
      const community = this.communities.get(communityId);
      if (community && community.memberCount > 0) {
        community.memberCount -= 1;
        this.communities.set(communityId, community);
      }
    }
  }

  async getUserCommunities(userId: string): Promise<Community[]> {
    const userMemberships = Array.from(this.communityMembers.values())
      .filter(m => m.userId === userId);
    
    return userMemberships
      .map(m => this.communities.get(m.communityId))
      .filter(Boolean) as Community[];
  }

  async getPosts(communityId?: string): Promise<PostWithAuthor[]> {
    let posts = Array.from(this.posts.values());
    
    if (communityId) {
      posts = posts.filter(p => p.communityId === communityId);
    }

    return posts.map(post => {
      const author = this.users.get(post.authorId)!;
      const community = post.communityId ? this.communities.get(post.communityId) : undefined;
      
      return {
        ...post,
        author,
        community,
        isLiked: false, // Would check user likes in real implementation
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPost(id: string): Promise<PostWithAuthor | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;

    const author = this.users.get(post.authorId)!;
    const community = post.communityId ? this.communities.get(post.communityId) : undefined;

    return {
      ...post,
      author,
      community,
      isLiked: false,
    };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = randomUUID();
    const post: Post = {
      ...insertPost,
      id,
      communityId: insertPost.communityId || null,
      imageUrl: insertPost.imageUrl || null,
      videoUrl: insertPost.videoUrl || null,
      likes: 0,
      comments: 0,
      createdAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async likePost(userId: string, postId: string): Promise<void> {
    const likeId = randomUUID();
    this.postLikes.set(likeId, { userId, postId });
    
    const post = this.posts.get(postId);
    if (post) {
      post.likes += 1;
      this.posts.set(postId, post);
    }
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    const like = Array.from(this.postLikes.entries())
      .find(([_, l]) => l.userId === userId && l.postId === postId);
    
    if (like) {
      this.postLikes.delete(like[0]);
      
      const post = this.posts.get(postId);
      if (post && post.likes > 0) {
        post.likes -= 1;
        this.posts.set(postId, post);
      }
    }
  }

  async getCourses(): Promise<CourseWithProgress[]> {
    return Array.from(this.courses.values()).map(course => ({
      ...course,
      progress: undefined, // Would check user progress in real implementation
    }));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const course: Course = {
      ...insertCourse,
      id,
      rating: insertCourse.rating || "4.5",
      reviewCount: insertCourse.reviewCount || 0,
      price: insertCourse.price || 0,
      isPremium: insertCourse.isPremium || false,
      createdAt: new Date(),
    };
    this.courses.set(id, course);
    return course;
  }

  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined> {
    return this.userProgress.get(`${userId}-${courseId}`);
  }

  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const key = `${insertProgress.userId}-${insertProgress.courseId}`;
    const existing = this.userProgress.get(key);
    
    const progress: UserProgress = {
      id: existing?.id || randomUUID(),
      ...insertProgress,
      progress: insertProgress.progress || 0,
      completed: insertProgress.completed || false,
      lastWatched: new Date(),
    };
    
    this.userProgress.set(key, progress);
    return progress;
  }

  async getAiConversation(userId: string, courseId?: string): Promise<AiConversation | undefined> {
    const key = courseId ? `${userId}-${courseId}` : userId;
    return Array.from(this.aiConversations.values())
      .find(c => c.userId === userId && c.courseId === courseId);
  }

  async createAiConversation(insertConversation: InsertAiConversation): Promise<AiConversation> {
    const id = randomUUID();
    const conversation: AiConversation = {
      ...insertConversation,
      id,
      courseId: insertConversation.courseId || null,
      messages: insertConversation.messages || [],
      createdAt: new Date(),
    };
    this.aiConversations.set(id, conversation);
    return conversation;
  }

  async updateAiConversation(id: string, messages: any[]): Promise<AiConversation> {
    const conversation = this.aiConversations.get(id);
    if (!conversation) throw new Error("Conversation not found");
    
    const updated = { ...conversation, messages };
    this.aiConversations.set(id, updated);
    return updated;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCommunities(): Promise<CommunityWithMembership[]> {
    const allCommunities = await db.select().from(communities);
    return allCommunities.map(community => ({
      ...community,
      isMember: false, // TODO: Check membership in real implementation
    }));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community || undefined;
  }

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const [community] = await db
      .insert(communities)
      .values({
        ...insertCommunity,
        description: insertCommunity.description || null,
      })
      .returning();
    return community;
  }

  async joinCommunity(userId: string, communityId: string): Promise<void> {
    await db.insert(communityMembers).values({
      userId,
      communityId,
    });

    // Update member count
    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, communityId));
  }

  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    await db
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      );

    // Update member count
    await db
      .update(communities)
      .set({ memberCount: sql`GREATEST(${communities.memberCount} - 1, 0)` })
      .where(eq(communities.id, communityId));
  }

  async getUserCommunities(userId: string): Promise<Community[]> {
    const userCommunityMemberships = await db
      .select({ community: communities })
      .from(communityMembers)
      .innerJoin(communities, eq(communityMembers.communityId, communities.id))
      .where(eq(communityMembers.userId, userId));

    return userCommunityMemberships.map(row => row.community);
  }

  async getPosts(communityId?: string): Promise<PostWithAuthor[]> {
    let query = db
      .select({
        post: posts,
        author: users,
        community: communities,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .orderBy(desc(posts.createdAt));

    if (communityId) {
      query = query.where(eq(posts.communityId, communityId));
    }

    const results = await query;

    return results.map(row => ({
      ...row.post,
      author: row.author,
      community: row.community || undefined,
      isLiked: false, // TODO: Check user likes in real implementation
    }));
  }

  async getPost(id: string): Promise<PostWithAuthor | undefined> {
    const [result] = await db
      .select({
        post: posts,
        author: users,
        community: communities,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .where(eq(posts.id, id));

    if (!result) return undefined;

    return {
      ...result.post,
      author: result.author,
      community: result.community || undefined,
      isLiked: false,
    };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({
        ...insertPost,
        communityId: insertPost.communityId || null,
        imageUrl: insertPost.imageUrl || null,
        videoUrl: insertPost.videoUrl || null,
      })
      .returning();
    return post;
  }

  async likePost(userId: string, postId: string): Promise<void> {
    await db.insert(postLikes).values({
      userId,
      postId,
    });

    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId));
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db
      .delete(postLikes)
      .where(
        and(
          eq(postLikes.userId, userId),
          eq(postLikes.postId, postId)
        )
      );

    await db
      .update(posts)
      .set({ likes: sql`GREATEST(${posts.likes} - 1, 0)` })
      .where(eq(posts.id, postId));
  }

  async getCourses(): Promise<CourseWithProgress[]> {
    const allCourses = await db.select().from(courses);
    return allCourses.map(course => ({
      ...course,
      progress: undefined, // TODO: Check user progress in real implementation
    }));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values({
        ...insertCourse,
        rating: insertCourse.rating || "4.5",
        reviewCount: insertCourse.reviewCount || 0,
        price: insertCourse.price || 0,
        isPremium: insertCourse.isPremium || false,
      })
      .returning();
    return course;
  }

  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.courseId, courseId)
        )
      );
    return progress || undefined;
  }

  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const existing = await this.getUserProgress(insertProgress.userId, insertProgress.courseId);

    if (existing) {
      const [progress] = await db
        .update(userProgress)
        .set({
          progress: insertProgress.progress || existing.progress,
          completed: insertProgress.completed || existing.completed,
          lastWatched: new Date(),
        })
        .where(eq(userProgress.id, existing.id))
        .returning();
      return progress;
    } else {
      const [progress] = await db
        .insert(userProgress)
        .values({
          ...insertProgress,
          progress: insertProgress.progress || 0,
          completed: insertProgress.completed || false,
        })
        .returning();
      return progress;
    }
  }

  async getAiConversation(userId: string, courseId?: string): Promise<AiConversation | undefined> {
    if (courseId) {
      const [conversation] = await db
        .select()
        .from(aiConversations)
        .where(and(eq(aiConversations.userId, userId), eq(aiConversations.courseId, courseId)));
      return conversation || undefined;
    } else {
      const [conversation] = await db
        .select()
        .from(aiConversations)
        .where(and(eq(aiConversations.userId, userId), eq(aiConversations.courseId, null)));
      return conversation || undefined;
    }
  }

  async createAiConversation(insertConversation: InsertAiConversation): Promise<AiConversation> {
    const [conversation] = await db
      .insert(aiConversations)
      .values({
        ...insertConversation,
        courseId: insertConversation.courseId || null,
        messages: insertConversation.messages || [],
      })
      .returning();
    return conversation;
  }

  async updateAiConversation(id: string, messages: any[]): Promise<AiConversation> {
    const [conversation] = await db
      .update(aiConversations)
      .set({ messages })
      .where(eq(aiConversations.id, id))
      .returning();
    return conversation;
  }

  // Financial Management Methods
  async getFinancialAccounts(userId: string): Promise<FinancialAccount[]> {
    const accounts = await db
      .select()
      .from(financialAccounts)
      .where(and(eq(financialAccounts.userId, userId), eq(financialAccounts.isActive, true)));
    return accounts;
  }

  async createFinancialAccount(insertAccount: InsertFinancialAccount): Promise<FinancialAccount> {
    const [account] = await db
      .insert(financialAccounts)
      .values(insertAccount)
      .returning();
    return account;
  }

  async updateFinancialAccount(id: string, updates: Partial<FinancialAccount>): Promise<FinancialAccount> {
    const [account] = await db
      .update(financialAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(financialAccounts.id, id))
      .returning();
    return account;
  }

  async deleteFinancialAccount(id: string): Promise<void> {
    await db
      .update(financialAccounts)
      .set({ isActive: false })
      .where(eq(financialAccounts.id, id));
  }

  async getTransactions(userId: string, accountId?: string): Promise<Transaction[]> {
    if (accountId) {
      return await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.accountId, accountId)))
        .orderBy(desc(transactions.transactionDate));
    } else {
      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.transactionDate));
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db
      .delete(transactions)
      .where(eq(transactions.id, id));
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    const budgetList = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.isActive, true)));
    return budgetList;
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const [budget] = await db
      .insert(budgets)
      .values(insertBudget)
      .returning();
    return budget;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const [budget] = await db
      .update(budgets)
      .set(updates)
      .where(eq(budgets.id, id))
      .returning();
    return budget;
  }

  async deleteBudget(id: string): Promise<void> {
    await db
      .update(budgets)
      .set({ isActive: false })
      .where(eq(budgets.id, id));
  }

  async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    const goals = await db
      .select()
      .from(financialGoals)
      .where(eq(financialGoals.userId, userId))
      .orderBy(desc(financialGoals.targetDate));
    return goals;
  }

  async createFinancialGoal(insertGoal: InsertFinancialGoal): Promise<FinancialGoal> {
    const [goal] = await db
      .insert(financialGoals)
      .values(insertGoal)
      .returning();
    return goal;
  }

  async updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const [goal] = await db
      .update(financialGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(financialGoals.id, id))
      .returning();
    return goal;
  }

  async deleteFinancialGoal(id: string): Promise<void> {
    await db
      .delete(financialGoals)
      .where(eq(financialGoals.id, id));
  }

  async getInvestments(userId: string): Promise<Investment[]> {
    const investmentList = await db
      .select()
      .from(investments)
      .where(eq(investments.userId, userId))
      .orderBy(desc(investments.purchaseDate));
    return investmentList;
  }

  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    const [investment] = await db
      .insert(investments)
      .values(insertInvestment)
      .returning();
    return investment;
  }

  async updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment> {
    const [investment] = await db
      .update(investments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(investments.id, id))
      .returning();
    return investment;
  }

  async deleteInvestment(id: string): Promise<void> {
    await db
      .delete(investments)
      .where(eq(investments.id, id));
  }

  // Credit Management Methods
  async getCreditReports(userId: string): Promise<CreditReport[]> {
    return await db
      .select()
      .from(creditReports)
      .where(and(eq(creditReports.userId, userId), eq(creditReports.isActive, true)))
      .orderBy(desc(creditReports.reportDate));
  }

  async createCreditReport(insertReport: InsertCreditReport): Promise<CreditReport> {
    const [report] = await db
      .insert(creditReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async updateCreditReport(id: string, updates: Partial<CreditReport>): Promise<CreditReport> {
    const [report] = await db
      .update(creditReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(creditReports.id, id))
      .returning();
    return report;
  }

  async deleteCreditReport(id: string): Promise<void> {
    await db
      .update(creditReports)
      .set({ isActive: false })
      .where(eq(creditReports.id, id));
  }

  async getCreditAccounts(userId: string, reportId?: string): Promise<CreditAccount[]> {
    if (reportId) {
      return await db
        .select()
        .from(creditAccounts)
        .where(and(eq(creditAccounts.userId, userId), eq(creditAccounts.reportId, reportId)))
        .orderBy(desc(creditAccounts.dateOpened));
    } else {
      return await db
        .select()
        .from(creditAccounts)
        .where(eq(creditAccounts.userId, userId))
        .orderBy(desc(creditAccounts.dateOpened));
    }
  }

  async createCreditAccount(insertAccount: InsertCreditAccount): Promise<CreditAccount> {
    const [account] = await db
      .insert(creditAccounts)
      .values(insertAccount)
      .returning();
    return account;
  }

  async updateCreditAccount(id: string, updates: Partial<CreditAccount>): Promise<CreditAccount> {
    const [account] = await db
      .update(creditAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(creditAccounts.id, id))
      .returning();
    return account;
  }

  async deleteCreditAccount(id: string): Promise<void> {
    await db
      .delete(creditAccounts)
      .where(eq(creditAccounts.id, id));
  }

  async getCreditDisputes(userId: string): Promise<CreditDispute[]> {
    return await db
      .select()
      .from(creditDisputes)
      .where(eq(creditDisputes.userId, userId))
      .orderBy(desc(creditDisputes.createdAt));
  }

  async createCreditDispute(insertDispute: InsertCreditDispute): Promise<CreditDispute> {
    const [dispute] = await db
      .insert(creditDisputes)
      .values(insertDispute)
      .returning();
    return dispute;
  }

  async updateCreditDispute(id: string, updates: Partial<CreditDispute>): Promise<CreditDispute> {
    const [dispute] = await db
      .update(creditDisputes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(creditDisputes.id, id))
      .returning();
    return dispute;
  }

  async deleteCreditDispute(id: string): Promise<void> {
    await db
      .delete(creditDisputes)
      .where(eq(creditDisputes.id, id));
  }

  async getCreditMonitoring(userId: string): Promise<CreditMonitoring[]> {
    return await db
      .select()
      .from(creditMonitoring)
      .where(eq(creditMonitoring.userId, userId))
      .orderBy(desc(creditMonitoring.createdAt));
  }

  async createCreditMonitoring(insertMonitoring: InsertCreditMonitoring): Promise<CreditMonitoring> {
    const [monitoring] = await db
      .insert(creditMonitoring)
      .values(insertMonitoring)
      .returning();
    return monitoring;
  }

  async markCreditAlertRead(id: string): Promise<void> {
    await db
      .update(creditMonitoring)
      .set({ isRead: true })
      .where(eq(creditMonitoring.id, id));
  }

  async getBureauCommunications(userId: string, disputeId?: string): Promise<BureauCommunication[]> {
    if (disputeId) {
      return await db
        .select()
        .from(bureauCommunications)
        .where(and(eq(bureauCommunications.userId, userId), eq(bureauCommunications.disputeId, disputeId)))
        .orderBy(desc(bureauCommunications.sentDate));
    } else {
      return await db
        .select()
        .from(bureauCommunications)
        .where(eq(bureauCommunications.userId, userId))
        .orderBy(desc(bureauCommunications.sentDate));
    }
  }

  async createBureauCommunication(insertCommunication: InsertBureauCommunication): Promise<BureauCommunication> {
    const [communication] = await db
      .insert(bureauCommunications)
      .values(insertCommunication)
      .returning();
    return communication;
  }

  async updateBureauCommunication(id: string, updates: Partial<BureauCommunication>): Promise<BureauCommunication> {
    const [communication] = await db
      .update(bureauCommunications)
      .set(updates)
      .where(eq(bureauCommunications.id, id))
      .returning();
    return communication;
  }

  async generateDisputeLetter(disputeType: string, disputeReason: string, method: string, accountInfo: any): Promise<string> {
    const currentDate = new Date().toLocaleDateString();
    let template = "";

    // Section 609 Letter Templates
    if (method === "section_609") {
      template = `Dear Credit Reporting Agency,

I am writing to you under Section 609 of the Fair Credit Reporting Act (FCRA) to request verification of the following information on my credit report:

Account: ${accountInfo.creditorName}
Account Number: ${accountInfo.accountNumber}
Account Type: ${accountInfo.accountType}

I am disputing this item because: ${disputeReason}

Under Section 609 of the FCRA, you are required to provide me with the method of verification used to verify this account. Please provide:

1. The original contract or application that bears my signature
2. Complete account history and payment records
3. Proof that you have the right to collect this debt
4. Proof that the account belongs to me

If you cannot provide complete verification as required by law, this item must be deleted from my credit report immediately.

Please conduct your investigation and respond within 30 days as required by the FCRA.

Sincerely,
[Your Name]
Date: ${currentDate}`;
    }

    // FCRA 623 Letter Template
    else if (method === "fcra_623") {
      template = `Dear ${accountInfo.creditorName},

I am writing to dispute inaccurate information you have reported to the credit bureaus regarding my account:

Account Number: ${accountInfo.accountNumber}
Dispute Reason: ${disputeReason}

Under Section 623 of the Fair Credit Reporting Act, you have a duty to investigate disputes and report accurate information. The information you are reporting is inaccurate for the following reasons:

${disputeReason}

I request that you:
1. Investigate this dispute thoroughly
2. Correct the inaccurate information with all credit bureaus
3. Provide me with written confirmation of the correction

Please complete your investigation within 30 days and provide me with documentation of any changes made to my credit reports.

Sincerely,
[Your Name]
Date: ${currentDate}`;
    }

    // Validation Letter Template
    else if (method === "validation") {
      template = `Dear Credit Bureau,

I am formally requesting validation of the following account appearing on my credit report:

Creditor: ${accountInfo.creditorName}
Account Number: ${accountInfo.accountNumber}
Reported Balance: $${(accountInfo.balance / 100).toFixed(2)}

I dispute this account because: ${disputeReason}

Please provide validation that:
1. This account belongs to me
2. The information reported is accurate and complete
3. You have verified this information with the original creditor
4. The reporting complies with all FCRA requirements

If you cannot validate this information completely, it must be removed from my credit report immediately per the Fair Credit Reporting Act.

I look forward to your response within 30 days.

Sincerely,
[Your Name]
Date: ${currentDate}`;
    }

    // Default verification letter
    else {
      template = `Dear Credit Bureau,

I am writing to dispute the following information in my file:

Account: ${accountInfo.creditorName}
Account Number: ${accountInfo.accountNumber}
Reason for Dispute: ${disputeReason}

This information is inaccurate because: ${disputeReason}

I am requesting that the item be removed or corrected. Enclosed are copies of supporting documents.

Please investigate this matter and delete or correct the disputed item as soon as possible.

Sincerely,
[Your Name]
Date: ${currentDate}`;
    }

    return template;
  }
}

export const storage = new DatabaseStorage();
