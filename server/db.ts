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
  // Database not configured
  console.log("⚠️  Database not configured. Please add DATABASE_URL to your environment variables.");
  console.log("   1. Go to https://neon.tech and create a free account");
  console.log("   2. Create a new project"); 
  console.log("   3. Copy the connection string");
  console.log("   4. Add it as DATABASE_URL in your Replit Secrets");
  db = null;
  pool = null;
}

export { db, pool, isDatabaseAvailable };