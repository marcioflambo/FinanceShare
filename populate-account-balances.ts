import { db, databaseInitialization } from "./server/db";

async function populateAccountBalances() {
  try {
    await databaseInitialization;
    
    if (!db) {
      throw new Error("Database connection not available");
    }
    
    console.log("🔧 Populating account_balances system...");
    
    // Criar conta bancária de teste se não existir
    const createAccountSQL = `
      INSERT INTO bank_accounts (name, type, color, user_id, balance, is_active) 
      VALUES ('Conta Corrente', 'checking', '#4ECDC4', 1, 1000.00, 1)
      ON DUPLICATE KEY UPDATE balance = balance
    `;
    const accountResult = await db.execute(createAccountSQL as any);
    console.log("✅ Test bank account created/verified");
    
    // Verificar se conta existe
    const checkAccountSQL = `SELECT id, name, balance FROM bank_accounts WHERE user_id = 1 LIMIT 1`;
    const accounts = await db.execute(checkAccountSQL as any);
    console.log("📋 Available accounts:", accounts[0]);
    
    if (accounts[0] && accounts[0].length > 0) {
      const accountId = accounts[0][0].id;
      const initialBalance = accounts[0][0].balance;
      
      // Inicializar saldo calculado
      const initBalanceSQL = `
        INSERT INTO account_balances (user_id, account_id, calculated_balance) 
        VALUES (1, ${accountId}, ${initialBalance}) 
        ON DUPLICATE KEY UPDATE calculated_balance = ${initialBalance}
      `;
      await db.execute(initBalanceSQL as any);
      console.log(`✅ Account balance initialized for account ${accountId} with balance ${initialBalance}`);
      
      // Testar busca do saldo calculado
      const getBalanceSQL = `SELECT * FROM account_balances WHERE user_id = 1 AND account_id = ${accountId}`;
      const balanceResult = await db.execute(getBalanceSQL as any);
      console.log("📊 Calculated balance:", balanceResult[0]);
    }
    
    console.log("🎉 Account balances system ready!");
    
  } catch (error) {
    console.error("❌ Error populating account_balances:", error);
  }
  
  process.exit(0);
}

populateAccountBalances();