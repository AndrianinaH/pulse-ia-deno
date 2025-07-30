import { db } from "../drizzle/db.ts";
import { Hono } from "hono";
import { post } from "../drizzle/schema.ts";
import { asc, desc } from "drizzle-orm";

export const postRoute = new Hono();

postRoute.get("/", async (c) => {
  const { page = 1, pageSize = 10, orderBy = "createdAt:desc" } = c.req.query();

  const [field, direction] = orderBy.split(":");

  const posts = await db.query.post.findMany({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: [direction === "asc" ? asc(post[field]) : desc(post[field])],
  });
  return c.json(posts);
});
