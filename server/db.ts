import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

let db: ReturnType<typeof drizzle>;

export function getDb() {
  if (!db) {
    const sql = neon(process.env.DATABASE_URL!);
    db = drizzle(sql, { schema });
  }
  return db;
}

export { schema };