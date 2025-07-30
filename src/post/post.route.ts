import { db } from "../drizzle/db.ts";
import { Hono } from "hono";

export const postRoute = new Hono();

postRoute.get("/", async (c) => {
  const posts = await db.query.post.findMany();
  return c.json(posts);
});
