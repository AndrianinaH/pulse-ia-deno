// src/utils/auth-middleware.ts
import { verifyJwt } from "../utils/jwt.ts";
import type { Context, Next } from "hono";

export const authMiddleware = async (c: Context, next: Next) => {
  const auth = c.req.header("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return c.json({ message: "Missing or invalid Authorization header" }, 401);
  }

  const token = auth.slice(7);
  const payload = await verifyJwt(token);
  if (!payload) {
    return c.json({ message: "Invalid or expired token" }, 401);
  }

  c.set("jwtPayload", payload);
  await next();
};
