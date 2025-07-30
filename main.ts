// main.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { postRoute } from "./src/post/post.route.ts";
import { statsRoute } from "./src/stats/stats.route.ts";
import { loginRoute } from "./src/login/login.route.ts";
import { authMiddleware } from "./src/utils/auth-middleware.ts";

const app = new Hono();

app.use("/*", cors({ origin: "*" }));

// Routes publiques (aucune authent requise)
app.get("/", (c) => c.text("Hello Hono!"));
app.route("/login", loginRoute);

// TOUTES les autres routes passent par authMiddleware
app.use("/posts/*", authMiddleware);
app.use("/stats/*", authMiddleware);

app.route("/posts", postRoute);
app.route("/stats", statsRoute);

Deno.serve(app.fetch);
