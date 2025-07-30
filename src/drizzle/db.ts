import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema.ts";

const connectionString = Deno.env.get("DATABASE_URL");

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = new Client({
  connectionString: connectionString,
});

await client.connect();

export const db = drizzle(client, { schema });