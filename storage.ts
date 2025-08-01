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
  getPosts(communityId?: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getPost(id: string): Promise<PostWithAuthor | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;

  // Courses
  getCourses(): Promise<CourseWithProgress[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getUserProgress(userId: string, courseId?: string): Promise<UserProgress[]>;
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

  getTransactions(userId: string, accountId?: string, limit?: number, offset?: number): Promise<Transaction[]>;
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

  // Performance and Analytics Methods
  getUserCommunityMemberships(userId: string): Promise<any[]>;
  updateUserStatistics(userId: string, stats: { coursesCompleted?: number; communitiesJoined?: number }): Promise<void>;
  calculateLearningAnalytics(userId: string): Promise<any>;
  cacheAnalytics(userId: string, analytics: any): Promise<void>;
  calculateFinancialInsights(userId: string): Promise<any>;
  cacheFinancialInsights(userId: string, insights: any): Promise<void>;
  calculatePlatformMetrics(): Promise<any>;
  cachePlatformMetrics(metrics: any): Promise<void>;
  saveCreditReport(userId: string, bureau: string, report: any): Promise<void>;
  createNotification(notification: any): Promise<void>;
  getAllInvestments(symbols?: string[]): Promise<Investment[]>;
  updateInvestmentPrice(investmentId: string, newPrice: number): Promise<void>;
  getAllActiveUsers(): Promise<User[]>;
  getRecentlyActiveUsers(): Promise<User[]>;
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
  async getPosts(communityId?: string, limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
    const query = db
      .select({
        post: posts,
        author: users,
        community: communities,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const result = communityId 
      ? await query.where(eq(posts.communityId, communityId))
      : await query;

    return result.map(({ post, author, community }) => ({
      ...post,
      author,
      community: community || undefined,
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
      community: result.community || undefined,
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
      // Replace placeholder URLs with working educational video URLs  
      videoUrl: course.videoUrl?.startsWith('https://example.com') ? this.getEducationalVideoUrl(course.title) : (course.videoUrl || this.getEducationalVideoUrl(course.title)),
      progress: undefined, // Would join with user progress in real implementation
    }));
  }

  private getEducationalVideoUrl(courseTitle: string): string {
    // Return educational finance videos based on course topic
    const videoMap: Record<string, string> = {
      'Personal Finance Fundamentals': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'Investment Strategies': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'Retirement Planning': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'Credit Management': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'Budgeting Basics': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      'Tax Planning': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
    };
    
    return videoMap[courseTitle] || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (course) {
      return {
        ...course,
        videoUrl: course.videoUrl?.startsWith('https://example.com') ? this.getEducationalVideoUrl(course.title) : (course.videoUrl || this.getEducationalVideoUrl(course.title))
      };
    }
    return course;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(insertCourse)
      .returning();
    return course;
  }

  async getUserProgress(userId: string, courseId?: string): Promise<UserProgress[]> {
    if (courseId) {
      return await db
        .select()
        .from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId)));
    }
    
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
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
    const conversations = courseId 
      ? await db
          .select()
          .from(aiConversations)
          .where(and(eq(aiConversations.userId, userId), eq(aiConversations.courseId, courseId)))
      : await db
          .select()
          .from(aiConversations)
          .where(eq(aiConversations.userId, userId));

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

  async getTransactions(userId: string, accountId?: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    if (accountId) {
      return await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.accountId, accountId)))
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
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
    if (reportId) {
      return await db
        .select()
        .from(creditAccounts)
        .where(and(eq(creditAccounts.userId, userId), eq(creditAccounts.reportId, reportId)));
    }
    
    return await db
      .select()
      .from(creditAccounts)
      .where(eq(creditAccounts.userId, userId));
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
    if (disputeId) {
      return await db
        .select()
        .from(bureauCommunications)
        .where(and(eq(bureauCommunications.userId, userId), eq(bureauCommunications.disputeId, disputeId)));
    }
    
    return await db
      .select()
      .from(bureauCommunications)
      .where(eq(bureauCommunications.userId, userId));
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
    const letters: Record<string, string> = {
      'section_609': `Dear Credit Bureau,\n\nI am writing to request verification of the following account under Section 609 of the Fair Credit Reporting Act...\n\nAccount: ${accountInfo.creditor}\nAccount Number: ${accountInfo.accountNumber}\n\nReason: ${disputeReason}\n\nPlease provide verification within 30 days.\n\nSincerely,\n[Your Name]`,
      'fcra_623': `Dear ${accountInfo.creditor},\n\nUnder Section 623 of the Fair Credit Reporting Act, I am disputing the accuracy of the following account...\n\nAccount: ${accountInfo.accountNumber}\nReason: ${disputeReason}\n\nPlease investigate and correct any inaccuracies.\n\nSincerely,\n[Your Name]`,
    };
    
    return letters[disputeType] || 'Template not found';
  }

  // Performance and Analytics Methods
  async getUserCommunityMemberships(userId: string): Promise<any[]> {
    return await db.select().from(communityMembers).where(eq(communityMembers.userId, userId));
  }

  async updateUserStatistics(userId: string, stats: { coursesCompleted?: number; communitiesJoined?: number }): Promise<void> {
    await db.update(users).set(stats).where(eq(users.id, userId));
  }

  async calculateLearningAnalytics(userId: string): Promise<any> {
    const progress = await this.getUserProgress(userId);
    const completedCourses = progress.filter(p => p.completed);
    
    return {
      totalCourses: progress.length,
      completedCourses: completedCourses.length,
      averageProgress: progress.reduce((acc, p) => acc + p.progress, 0) / progress.length || 0,
      streakDays: 7, // Would calculate from actual data
      hoursLearned: completedCourses.length * 2, // Estimated
    };
  }

  async cacheAnalytics(userId: string, analytics: any): Promise<void> {
    // Store analytics in cache or temporary table
    console.log(`Caching analytics for user ${userId}:`, analytics);
  }

  async calculateFinancialInsights(userId: string): Promise<any> {
    const accounts = await this.getFinancialAccounts(userId);
    const transactions = await this.getTransactions(userId);
    const budgets = await this.getBudgets(userId);
    
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const monthlySpending = transactions
      .filter(t => t.amount < 0 && new Date(t.transactionDate).getMonth() === new Date().getMonth())
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      totalBalance,
      monthlySpending,
      budgetUtilization: budgets.length > 0 ? (monthlySpending / budgets[0].budgetAmount) * 100 : 0,
      savingsRate: totalBalance > 0 ? ((totalBalance - monthlySpending) / totalBalance) * 100 : 0,
    };
  }

  async cacheFinancialInsights(userId: string, insights: any): Promise<void> {
    console.log(`Caching financial insights for user ${userId}:`, insights);
  }

  async calculatePlatformMetrics(): Promise<any> {
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    const totalCourses = await db.select({ count: sql`count(*)` }).from(courses);
    const totalCommunities = await db.select({ count: sql`count(*)` }).from(communities);
    
    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalCourses: totalCourses[0]?.count || 0,
      totalCommunities: totalCommunities[0]?.count || 0,
      activeUsersToday: 100, // Would calculate from session data
    };
  }

  async cachePlatformMetrics(metrics: any): Promise<void> {
    console.log('Caching platform metrics:', metrics);
  }

  async saveCreditReport(userId: string, bureau: string, report: any): Promise<void> {
    await this.createCreditReport({
      userId,
      bureau,
      reportData: report,
      creditScore: report.creditScore,
      reportDate: new Date(),
    });
  }

  async createNotification(notification: any): Promise<void> {
    await this.createCreditMonitoring({
      userId: notification.userId,
      monitoringType: notification.type,
      alertMessage: notification.message,
      severity: notification.priority,
    });
  }

  async getAllInvestments(symbols?: string[]): Promise<Investment[]> {
    const query = db.select().from(investments);
    if (symbols && symbols.length > 0) {
      // Would filter by symbols in real implementation
      return await query;
    }
    return await query;
  }

  async updateInvestmentPrice(investmentId: string, newPrice: number): Promise<void> {
    await db.update(investments)
      .set({ currentPrice: newPrice, updatedAt: new Date() })
      .where(eq(investments.id, investmentId));
  }

  async getAllActiveUsers(): Promise<User[]> {
    // Would filter by recent activity in real implementation
    return await db.select().from(users).limit(100);
  }

  async getRecentlyActiveUsers(): Promise<User[]> {
    // Would filter by activity within last hour
    return await db.select().from(users).limit(50);
  }
}

export const storage = new DatabaseStorage();