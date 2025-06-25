import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
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
  // Database not available - will use MemStorage
  db = null;
  pool = null;
}

export { db, pool, isDatabaseAvailable };