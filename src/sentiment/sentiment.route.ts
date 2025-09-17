import { db } from "../drizzle/db.ts";
import { Hono } from "hono";
import { postSentimentScore, commentAnalysis } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

export const sentimentRoute = new Hono();

sentimentRoute.get("/post/:postId", async (c) => {
  const postId = c.req.param("postId");

  const sentiment = await db
    .select()
    .from(postSentimentScore)
    .where(eq(postSentimentScore.postId, postId))
    .limit(1);

  if (sentiment.length === 0) {
    return c.json({ error: "Post sentiment not found" }, 404);
  }

  return c.json(sentiment[0]);
});

sentimentRoute.get("/comments/:postId", async (c) => {
  const postId = c.req.param("postId");

  const comments = await db
    .select()
    .from(commentAnalysis)
    .where(eq(commentAnalysis.postId, postId));

  return c.json(comments);
});