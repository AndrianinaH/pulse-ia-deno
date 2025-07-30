import { Hono } from "hono";
import { cors } from "hono/cors";
import { postRoute } from "./src/post/post.route.ts";
import { statsRoute } from "./src/stats/stats.route.ts";
import { loginRoute } from "./src/login/login.route.ts";

const app = new Hono();

app.use("/*", cors({ origin: "*" }));

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/posts", postRoute);
app.route("/stats", statsRoute);
app.route("/login", loginRoute);

Deno.serve(app.fetch);
