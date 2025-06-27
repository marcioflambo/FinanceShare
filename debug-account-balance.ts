import { db, databaseInitialization } from "./server/db";

async function debugAccountBalance() {
  try {
    await databaseInitialization;
    
    if (!db) {
      throw new Error("Database connection not available");
    }
    
    console.log("🔍 Debugging account balance calculation...");
    
    // Check expenses for account 6
    const expensesSQL = `SELECT * FROM expenses WHERE account_id = 6 AND user_id = 1`;
    const expenses = await db.execute(expensesSQL as any);
    console.log("📋 Expenses for account 6:", expenses[0]);
    
    // Check current account balance
    const accountSQL = `SELECT * FROM bank_accounts WHERE id = 6`;
    const account = await db.execute(accountSQL as any);
    console.log("🏦 Account details:", account[0]);
    
    // Check calculated balance
    const balanceSQL = `SELECT * FROM account_balances WHERE account_id = 6 AND user_id = 1`;
    const balance = await db.execute(balanceSQL as any);
    console.log("💰 Calculated balance:", balance[0]);
    
    // Manual calculation
    if (expenses[0] && expenses[0].length > 0) {
      const totalDebits = expenses[0]
        .filter((exp: any) => exp.transaction_type === 'debit' || !exp.transaction_type)
        .reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);
      
      const totalCredits = expenses[0]
        .filter((exp: any) => exp.transaction_type === 'credit')
        .reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);
      
      const initialBalance = parseFloat(account[0][0].balance);
      const calculatedBalance = initialBalance + totalCredits - totalDebits;
      
      console.log(`📊 Manual calculation:
        Initial balance: ${initialBalance}
        Total debits: ${totalDebits}
        Total credits: ${totalCredits}
        Calculated balance: ${calculatedBalance.toFixed(2)}`);
      
      // Update the calculated balance
      const updateSQL = `
        UPDATE account_balances 
        SET calculated_balance = ${calculatedBalance.toFixed(2)}
        WHERE account_id = 6 AND user_id = 1
      `;
      await db.execute(updateSQL as any);
      console.log("✅ Balance updated successfully");
    }
    
  } catch (error) {
    console.error("❌ Error debugging account balance:", error);
  }
  
  process.exit(0);
}

debugAccountBalance();