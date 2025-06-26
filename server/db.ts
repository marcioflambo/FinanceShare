import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

// MySQL connection pool configuration
const mysqlConfig = {
  host: '186.202.152.149',
  user: 'mlopes6',
  password: 'G1ovann@040917',
  database: 'mlopes6',
  port: 3306,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  keepAliveInitialDelay: 0,
  enableKeepAlive: true
};

let db: any = null;
let pool: any = null;
let isDatabaseAvailable = false;

const initializeDatabase = async () => {
  try {
    console.log("🔄 Connecting to MySQL database...");
    
    // Create connection pool with proper error handling
    pool = mysql.createPool(mysqlConfig);
    
    // Add connection event handlers
    pool.on('connection', (connection: any) => {
      console.log('New connection established as id ' + connection.threadId);
    });

    pool.on('error', (err: any) => {
      console.error('Database pool error:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Attempting to reconnect...');
        initializeDatabase();
      }
    });
    
    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    console.log("✅ Successfully connected to MySQL database");
    
    db = drizzle(pool, { schema, mode: 'default' });
    isDatabaseAvailable = true;
    
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to MySQL database:", error);
    console.log("⚠️  Database connection failed. Check configuration.");
    db = null;
    pool = null;
    isDatabaseAvailable = false;
    return false;
  }
};

// Initialize database connection and export the promise
const databaseInitialization = initializeDatabase();

export { db, pool, isDatabaseAvailable, databaseInitialization };