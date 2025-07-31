import { db } from "../drizzle/db.ts";
import { Hono } from "hono";
import { post } from "../drizzle/schema.ts";
import { asc, desc, ilike } from "drizzle-orm";

export const postRoute = new Hono();

postRoute.get("/latest", async (c) => {
  const posts = await db
    .select()
    .from(post)
    .orderBy(desc(post.postCreatedAt))
    .limit(10);
  return c.json(posts);
});

postRoute.get("/", async (c) => {
  const {
    page = 1,
    pageSize = 10,
    orderBy = "postCreatedAt:desc",
    search = "",
  } = c.req.query();

  const pageNum = parseInt(page as string) || 1;
  const pageSizeNum = parseInt(pageSize as string) || 10;
  const [field, direction] = orderBy.split(":");
  const searchTerm = search.trim();

  const baseQuery = db.select().from(post);
  const filteredQuery = searchTerm ? baseQuery.where(ilike(post.messageText, `%${searchTerm}%`)) : baseQuery;

  const validFields = {
    'postCreatedAt': post.postCreatedAt,
    'createdAt': post.createdAt,
    'reactionCount': post.reactionCount,
    'commentCount': post.commentCount,
    'shareCount': post.shareCount,
    'videoViewCount': post.videoViewCount
  } as const;

  const fieldColumn = validFields[field as keyof typeof validFields] || post.postCreatedAt;

  const posts = await filteredQuery
    .orderBy(direction === "asc" ? asc(fieldColumn) : desc(fieldColumn))
    .limit(pageSizeNum)
    .offset((pageNum - 1) * pageSizeNum);

  return c.json(posts);
});
