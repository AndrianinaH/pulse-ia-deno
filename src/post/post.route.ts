import { db } from "../drizzle/db.ts";
import { Hono } from "hono";
import { post } from "../drizzle/schema.ts";
import { asc, desc } from "drizzle-orm";

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
  } = c.req.query();

  const [field, direction] = orderBy.split(":");
  const posts = await db
    .select()
    .from(post)
    .orderBy(direction === "asc" ? asc(post[field]) : desc(post[field]))
    .limit(+pageSize)
    .offset((+page - 1) * +pageSize);
  return c.json(posts);
});
