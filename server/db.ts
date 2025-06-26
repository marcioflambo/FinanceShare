import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if database is available
const isDatabaseAvailable = !!process.env.DATABASE_URL;

let db: any;
let pool: any;

if (isDatabaseAvailable) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // Use SQLite for local development
  const sqlite = new Database('financeapp.db');
  db = drizzleSqlite(sqlite, { schema });
}

export { db, pool, isDatabaseAvailable };