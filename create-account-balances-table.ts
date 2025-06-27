import { db } from "./server/db";
import { accountBalances } from "./shared/schema";

async function createAccountBalancesTable() {
  try {
    console.log("🔄 Criando tabela account_balances...");
    
    // Criar a tabela no MySQL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS account_balances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        accountId INT NOT NULL,
        calculatedBalance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_account (userId, accountId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (accountId) REFERENCES bank_accounts(id) ON DELETE CASCADE
      )
    `);
    
    console.log("✅ Tabela account_balances criada com sucesso");
    
    // Inicializar saldos para contas existentes
    const existingAccounts = await db.execute(`
      SELECT ba.id as accountId, ba.userId, ba.balance as initialBalance 
      FROM bank_accounts ba 
      WHERE ba.userId = 1
    `);
    
    console.log("🔄 Inicializando saldos calculados...");
    
    if (Array.isArray(existingAccounts) && existingAccounts.length > 0) {
      for (const account of existingAccounts) {
        await db.execute(`
          INSERT IGNORE INTO account_balances (userId, accountId, calculatedBalance)
          VALUES (?, ?, ?)
        `, [account.userId, account.accountId, account.initialBalance || '0.00']);
      }
    }
    
    console.log("✅ Saldos inicializados para todas as contas existentes");
    
  } catch (error) {
    console.error("❌ Erro ao criar tabela account_balances:", error);
  }
}

createAccountBalancesTable();