import { Hono } from "hono";
import { db } from "../drizzle/db.ts";
import { post } from "../drizzle/schema.ts";
import { sql } from "drizzle-orm";
import { ilike } from "drizzle-orm";

export const statsRoute = new Hono();

statsRoute.get("/", async (c) => {
  const stats = await db
    .select({
      totalReactions: sql<number>`sum(${post.reactionCount})`,
      totalComments: sql<number>`sum(${post.commentCount})`,
      totalShares: sql<number>`sum(${post.shareCount})`,
      totalVideoViews: sql<number>`sum(${post.videoViewCount})`,
      totalPosts: sql<number>`count(*)`,
    })
    .from(post);

  return c.json(stats[0]);
});

statsRoute.get("/search-stats", async (c) => {
  const { search = "" } = c.req.query();
  const searchTerm = search.trim();

  const baseQuery = db
    .select({
      totalReactions: sql<number>`sum(${post.reactionCount})`,
      totalComments: sql<number>`sum(${post.commentCount})`,
      totalShares: sql<number>`sum(${post.shareCount})`,
      totalVideoViews: sql<number>`sum(${post.videoViewCount})`,
      totalPosts: sql<number>`count(*)`,
    })
    .from(post);

  const query = searchTerm ? baseQuery.where(ilike(post.messageText, `%${searchTerm}%`)) : baseQuery;

  const stats = await query;
  return c.json(stats[0]);
});
