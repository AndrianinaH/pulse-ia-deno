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

  const pageNum = parseInt(page) || 1;
  const pageSizeNum = parseInt(pageSize) || 10;
  const [field, direction] = orderBy.split(":");
  const searchTerm = search.trim();

  let query = db.select().from(post);

  if (searchTerm) {
    query = query.where(ilike(post.messageText, `%${searchTerm}%`));
  }

  const posts = await query
    .orderBy(direction === "asc" ? asc(post[field]) : desc(post[field]))
    .limit(pageSizeNum)
    .offset((pageNum - 1) * pageSizeNum);

  return c.json(posts);
});
