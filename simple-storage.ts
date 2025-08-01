import {
  users,
  posts,
  comments,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
} from "@shared/simple-schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Interface for simplified storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Post operations
  getPosts(limit?: number, offset?: number): Promise<any[]>;
  createPost(post: InsertPost): Promise<Post>;
  likePost(postId: string): Promise<Post>;

  // Comment operations
  getPostComments(postId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
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

  // Post operations with pagination
  async getPosts(limit: number = 20, offset: number = 0): Promise<any[]> {
    return await db
      .select({
        id: posts.id,
        content: posts.content,
        authorId: posts.authorId,
        likes: posts.likes,
        comments: posts.comments,
        createdAt: posts.createdAt,
        authorName: users.firstName
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();
    return post;
  }

  async likePost(postId: string): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId))
      .returning();
    return updatedPost;
  }

  // Comment operations
  async getPostComments(postId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(commentData)
      .returning();
    return comment;
  }
}

export const storage = new DatabaseStorage();