import { Hono } from "hono";
import { db } from "../drizzle/db.ts";
import { post } from "../drizzle/schema.ts";
import { sql } from "drizzle-orm";

export const statsRoute = new Hono();

statsRoute.get("/", async (c) => {
  const stats = await db
    .select({
      totalReactions: sql<number>`sum(${post.reactionCount})`,
      totalComments: sql<number>`sum(${post.commentCount})`,
      totalShares: sql<number>`sum(${post.shareCount})`,
      totalVideoViews: sql<number>`sum(${post.videoViewCount})`,
    })
    .from(post);

  return c.json(stats[0]);
});
