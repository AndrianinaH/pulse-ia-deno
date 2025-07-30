import { Hono } from "hono";
import { db } from "../drizzle/db.ts";
import { users } from "../drizzle/schema.ts";
import { generateJwt } from "../utils/jwt.ts";

export const loginRoute = new Hono();

loginRoute.post("/", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });
    if (user && user.password === password) {
      const jwt = await generateJwt({
        userId: user.id,
        email: user.email,
      });
      return c.json({ message: "Login successful", token: jwt }, 200);
    } else {
      return c.json({ message: "Invalid email or password" }, 401);
    }
  } catch (e) {
    console.log("error", e);

    return c.json({ message: "Bad request" }, 400);
  }
});
