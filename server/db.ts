import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

// MySQL connection configuration
const mysqlConfig = {
  host: '186.202.152.149',
  user: 'mlopes6',
  password: 'G1ovann@040917',
  database: 'mlopes6',
  port: 3306,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000
};

let db: any = null;
let connection: any = null;
let isDatabaseAvailable = false;

const initializeDatabase = async () => {
  try {
    console.log("🔄 Connecting to MySQL database...");
    connection = await mysql.createConnection(mysqlConfig);
    
    // Test connection
    await connection.ping();
    console.log("✅ Successfully connected to MySQL database");
    
    db = drizzle(connection, { schema, mode: 'default' });
    isDatabaseAvailable = true;
    
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to MySQL database:", error);
    console.log("⚠️  Using fallback storage. Check database configuration.");
    db = null;
    connection = null;
    isDatabaseAvailable = false;
    return false;
  }
};

// Initialize database connection and export the promise
const databaseInitialization = initializeDatabase();

export { db, connection, isDatabaseAvailable, databaseInitialization };