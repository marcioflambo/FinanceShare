import { db, databaseInitialization } from "./server/db";
import mysql from 'mysql2/promise';

async function createAccountBalancesTable() {
  try {
    // Aguardar inicialização do banco de dados
    await databaseInitialization;
    
    if (!db) {
      throw new Error("Conexão com banco de dados não disponível");
    }
    
    console.log("🔨 Criando tabela account_balances...");
    
    // Criar tabela account_balances
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS account_balances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        account_id INT NOT NULL,
        calculated_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_account (user_id, account_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    // Executar SQL direto usando Drizzle
    await db.execute(createTableSQL as any);
    
    console.log("✅ Tabela account_balances criada com sucesso!");
    console.log("📋 Estrutura:");
    console.log("   - id: Chave primária auto-incremento");
    console.log("   - user_id: Referência para usuários");
    console.log("   - account_id: Referência para contas bancárias");
    console.log("   - calculated_balance: Saldo calculado");
    console.log("   - last_updated: Timestamp da última atualização");
    console.log("   - created_at: Timestamp de criação");
    console.log("   - Índice único: (user_id, account_id)");
    console.log("   - Foreign keys com CASCADE delete");
    
  } catch (error) {
    console.error("❌ Erro ao criar tabela:", error);
  }
  
  process.exit(0);
}

createAccountBalancesTable();