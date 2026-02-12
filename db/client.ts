import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false, // important for Supabase pooler (Transaction mode)
});

export const db = drizzle(client);
