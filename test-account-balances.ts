import { db, databaseInitialization } from "./server/db";

async function testAccountBalances() {
  try {
    await databaseInitialization;
    
    if (!db) {
      throw new Error("Database connection not available");
    }
    
    console.log("🔍 Testing account_balances table...");
    
    // Test table exists
    const checkTableSQL = `SHOW TABLES LIKE 'account_balances'`;
    const tableExists = await db.execute(checkTableSQL as any);
    console.log("📋 Table exists:", tableExists);
    
    // Test table structure
    const describeSQL = `DESCRIBE account_balances`;
    const structure = await db.execute(describeSQL as any);
    console.log("📋 Table structure:", structure);
    
    // Test insert
    const testInsertSQL = `
      INSERT INTO account_balances (user_id, account_id, calculated_balance) 
      VALUES (1, 1, 100.50) 
      ON DUPLICATE KEY UPDATE calculated_balance = 100.50
    `;
    await db.execute(testInsertSQL as any);
    console.log("✅ Insert test successful");
    
    // Test select
    const selectSQL = `SELECT * FROM account_balances WHERE user_id = 1 AND account_id = 1`;
    const result = await db.execute(selectSQL as any);
    console.log("📊 Select result:", result);
    
  } catch (error) {
    console.error("❌ Error testing account_balances:", error);
  }
  
  process.exit(0);
}

testAccountBalances();