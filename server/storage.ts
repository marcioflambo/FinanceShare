import { db, databaseInitialization } from "./db";
import { 
  users, categories, bankAccounts, expenses, billSplits, billSplitParticipants, 
  roommates, goals, goalAccounts, transfers, accountBalances,
  User, InsertUser, Category, InsertCategory, BankAccount, InsertBankAccount,
  Expense, InsertExpense, BillSplit, InsertBillSplit, BillSplitParticipant, InsertBillSplitParticipant,
  Roommate, InsertRoommate, Goal, InsertGoal, GoalAccount, InsertGoalAccount,
  Transfer, InsertTransfer, AccountBalance, InsertAccountBalance
} from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;

  // Categories
  getCategories(userId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoryById(id: number): Promise<Category | undefined>;

  // Bank Accounts
  getBankAccounts(userId: number): Promise<BankAccount[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  getBankAccountById(id: number): Promise<BankAccount | undefined>;
  updateBankAccount(id: number, account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccountBalance(id: number, balance: string): Promise<void>;
  updateBankAccountsOrder(accountIds: number[]): Promise<void>;
  deleteBankAccount(id: number): Promise<void>;

  // Expenses
  getExpenses(userId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]>;
  updateExpense(id: number, expense: InsertExpense): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<void>;

  // Bill Splits
  getBillSplits(userId: number): Promise<BillSplit[]>;
  createBillSplit(billSplit: InsertBillSplit): Promise<BillSplit>;
  getBillSplitById(id: number): Promise<BillSplit | undefined>;
  getBillSplitParticipants(billSplitId: number): Promise<BillSplitParticipant[]>;
  createBillSplitParticipant(participant: InsertBillSplitParticipant): Promise<BillSplitParticipant>;
  updateParticipantPaymentStatus(id: number, isPaid: boolean): Promise<void>;

  // Roommates
  getRoommates(userId: number): Promise<Roommate[]>;
  createRoommate(roommate: InsertRoommate): Promise<Roommate>;

  // Goals
  getGoals(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  getGoalById(id: number): Promise<Goal | undefined>;
  updateGoalProgress(id: number, currentAmount: string): Promise<void>;
  deleteGoal(id: number): Promise<void>;
  
  // Goal Accounts
  getGoalAccounts(goalId: number): Promise<GoalAccount[]>;
  addAccountToGoal(goalAccount: InsertGoalAccount): Promise<GoalAccount>;
  removeAccountFromGoal(goalId: number, accountId: number): Promise<void>;
  
  // Transfers
  getTransfers(userId: number): Promise<Transfer[]>;
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getTransferById(id: number): Promise<Transfer | undefined>;
  deleteTransfer(id: number): Promise<void>;
  
  // Account Balances (controle de saldos calculados)
  getAccountBalance(userId: number, accountId: number): Promise<AccountBalance | undefined>;
  updateAccountBalance(userId: number, accountId: number, newBalance: string): Promise<void>;
  initializeAccountBalance(userId: number, accountId: number): Promise<void>;
  calculateAccountBalance(userId: number, accountId: number): Promise<string>;
  recalculateAccountBalance(userId: number, accountId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser);
    const [user] = await db.select().from(users).where(eq(users.id, result[0].insertId));
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) return null;

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Categories
  async getCategories(userId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(insertCategory);
    const [category] = await db.select().from(categories).where(eq(categories.id, result[0].insertId));
    return category;
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  // Bank Accounts
  async getBankAccounts(userId: number): Promise<BankAccount[]> {
    const accounts = await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
    return accounts.sort((a: BankAccount, b: BankAccount) => {
      const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const result = await db.insert(bankAccounts).values(insertAccount);
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, result[0].insertId));
    
    // Inicializar saldo calculado
    await this.initializeAccountBalance(insertAccount.userId!, result[0].insertId);
    
    return account;
  }

  async getBankAccountById(id: number): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account || undefined;
  }

  async updateBankAccount(id: number, insertAccount: InsertBankAccount): Promise<BankAccount> {
    await db.update(bankAccounts).set(insertAccount).where(eq(bankAccounts.id, id));
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account;
  }

  async updateBankAccountBalance(id: number, balance: string): Promise<void> {
    await db.update(bankAccounts).set({ balance }).where(eq(bankAccounts.id, id));
  }

  async updateBankAccountsOrder(accountIds: number[]): Promise<void> {
    for (let i = 0; i < accountIds.length; i++) {
      await db.update(bankAccounts)
        .set({ sortOrder: i })
        .where(eq(bankAccounts.id, accountIds[i]));
    }
  }

  async deleteBankAccount(id: number): Promise<void> {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }

  // Expenses
  async getExpenses(userId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(insertExpense);
    const insertId = result[0].insertId;
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, insertId));
    
    // Recalcular saldo da conta após criar despesa
    if (insertExpense.accountId && insertExpense.userId) {
      await this.recalculateAccountBalance(insertExpense.userId, insertExpense.accountId);
    }
    
    return expense;
  }

  async getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`${expenses.date} >= ${startDate}`,
        sql`${expenses.date} <= ${endDate}`
      ));
  }

  async getExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        eq(expenses.categoryId, categoryId)
      ));
  }

  async updateExpense(id: number, insertExpense: InsertExpense): Promise<Expense | undefined> {
    const [originalExpense] = await db.select().from(expenses).where(eq(expenses.id, id));
    if (!originalExpense) return undefined;

    await db.update(expenses).set(insertExpense).where(eq(expenses.id, id));
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    
    // Recalcular saldo das contas afetadas
    if (originalExpense.accountId && originalExpense.userId) {
      await this.recalculateAccountBalance(originalExpense.userId, originalExpense.accountId);
    }
    if (insertExpense.accountId && insertExpense.userId && insertExpense.accountId !== originalExpense.accountId) {
      await this.recalculateAccountBalance(insertExpense.userId, insertExpense.accountId);
    }
    
    return expense;
  }

  async deleteExpense(id: number): Promise<void> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    await db.delete(expenses).where(eq(expenses.id, id));
    
    // Recalcular saldo da conta após deletar despesa
    if (expense && expense.accountId && expense.userId) {
      await this.recalculateAccountBalance(expense.userId, expense.accountId);
    }
  }

  // Bill Splits
  async getBillSplits(userId: number): Promise<BillSplit[]> {
    return await db.select().from(billSplits).where(eq(billSplits.createdBy, userId));
  }

  async createBillSplit(insertBillSplit: InsertBillSplit): Promise<BillSplit> {
    const result = await db.insert(billSplits).values(insertBillSplit);
    const [billSplit] = await db.select().from(billSplits).where(eq(billSplits.id, result[0].insertId));
    return billSplit;
  }

  async getBillSplitById(id: number): Promise<BillSplit | undefined> {
    const [billSplit] = await db.select().from(billSplits).where(eq(billSplits.id, id));
    return billSplit || undefined;
  }

  async getBillSplitParticipants(billSplitId: number): Promise<BillSplitParticipant[]> {
    return await db.select().from(billSplitParticipants).where(eq(billSplitParticipants.billSplitId, billSplitId));
  }

  async createBillSplitParticipant(insertParticipant: InsertBillSplitParticipant): Promise<BillSplitParticipant> {
    const result = await db.insert(billSplitParticipants).values(insertParticipant);
    const [participant] = await db.select().from(billSplitParticipants).where(eq(billSplitParticipants.id, result[0].insertId));
    return participant;
  }

  async updateParticipantPaymentStatus(id: number, isPaid: boolean): Promise<void> {
    await db.update(billSplitParticipants).set({ isPaid }).where(eq(billSplitParticipants.id, id));
  }

  // Roommates
  async getRoommates(userId: number): Promise<Roommate[]> {
    return await db.select().from(roommates).where(eq(roommates.userId, userId));
  }

  async createRoommate(insertRoommate: InsertRoommate): Promise<Roommate> {
    const result = await db.insert(roommates).values(insertRoommate);
    const [roommate] = await db.select().from(roommates).where(eq(roommates.id, result[0].insertId));
    return roommate;
  }

  // Goals
  async getGoals(userId: number): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const result = await db.insert(goals).values(insertGoal);
    const [goal] = await db.select().from(goals).where(eq(goals.id, result[0].insertId));
    return goal;
  }

  async getGoalById(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async updateGoalProgress(id: number, currentAmount: string): Promise<void> {
    await db.update(goals).set({ currentAmount }).where(eq(goals.id, id));
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Goal Accounts
  async getGoalAccounts(goalId: number): Promise<GoalAccount[]> {
    return await db.select().from(goalAccounts).where(eq(goalAccounts.goalId, goalId));
  }

  async addAccountToGoal(insertGoalAccount: InsertGoalAccount): Promise<GoalAccount> {
    const result = await db.insert(goalAccounts).values(insertGoalAccount);
    const [goalAccount] = await db.select().from(goalAccounts).where(eq(goalAccounts.id, result[0].insertId));
    return goalAccount;
  }

  async removeAccountFromGoal(goalId: number, accountId: number): Promise<void> {
    await db.delete(goalAccounts)
      .where(and(
        eq(goalAccounts.goalId, goalId),
        eq(goalAccounts.accountId, accountId)
      ));
  }

  // Transfers
  async getTransfers(userId: number): Promise<Transfer[]> {
    return await db.select().from(transfers).where(eq(transfers.userId, userId));
  }

  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const result = await db.insert(transfers).values(insertTransfer);
    const transferId = result[0].insertId;
    
    // Criar transação de débito na conta de origem (saída de dinheiro)
    const debitExpense = {
      description: `Transferência para conta destino - ${insertTransfer.description}`,
      amount: insertTransfer.amount,
      date: insertTransfer.date,
      categoryId: 5, // Categoria de Transferências
      accountId: insertTransfer.fromAccountId,
      userId: insertTransfer.userId,
      transactionType: "transfer_out" as const,
      isRecurring: insertTransfer.isRecurring || false,
      recurringType: insertTransfer.recurringType || null,
      recurringFrequency: insertTransfer.recurringFrequency || null,
      recurringInterval: insertTransfer.recurringInterval || null,
      installmentTotal: insertTransfer.installmentTotal || null,
      installmentCurrent: insertTransfer.isRecurring && insertTransfer.recurringType === "installments" ? 1 : null,
      recurringEndDate: insertTransfer.recurringEndDate || null,
      parentExpenseId: transferId // Vincula à transferência
    };
    
    // Criar transação de crédito na conta de destino (entrada de dinheiro)
    const creditExpense = {
      description: `Transferência da conta origem - ${insertTransfer.description}`,
      amount: insertTransfer.amount,
      date: insertTransfer.date,
      categoryId: 5, // Categoria de Transferências
      accountId: insertTransfer.toAccountId,
      userId: insertTransfer.userId,
      transactionType: "transfer_in" as const,
      isRecurring: insertTransfer.isRecurring || false,
      recurringType: insertTransfer.recurringType || null,
      recurringFrequency: insertTransfer.recurringFrequency || null,
      recurringInterval: insertTransfer.recurringInterval || null,
      installmentTotal: insertTransfer.installmentTotal || null,
      installmentCurrent: insertTransfer.isRecurring && insertTransfer.recurringType === "installments" ? 1 : null,
      recurringEndDate: insertTransfer.recurringEndDate || null,
      parentExpenseId: transferId // Vincula à transferência
    };
    
    // Inserir ambas as transações
    await db.insert(expenses).values(debitExpense);
    await db.insert(expenses).values(creditExpense);
    
    // Update account balances - não tocar nos saldos iniciais
    const amount = parseFloat(insertTransfer.amount);
    
    await db
      .update(bankAccounts)
      .set({ balance: sql`balance - ${amount}` })
      .where(eq(bankAccounts.id, insertTransfer.fromAccountId));
    
    await db
      .update(bankAccounts)
      .set({ balance: sql`balance + ${amount}` })
      .where(eq(bankAccounts.id, insertTransfer.toAccountId));
    
    // Recalcular saldos calculados
    await this.recalculateAccountBalance(insertTransfer.userId, insertTransfer.fromAccountId);
    await this.recalculateAccountBalance(insertTransfer.userId, insertTransfer.toAccountId);
    
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, transferId));
    return transfer;
  }

  async getTransferById(id: number): Promise<Transfer | undefined> {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, id));
    return transfer || undefined;
  }

  async deleteTransfer(id: number): Promise<void> {
    // Primeiro, obter informações da transferência
    const transfer = await this.getTransferById(id);
    if (!transfer) {
      throw new Error("Transferência não encontrada");
    }

    // Deletar as transações relacionadas (que têm parentExpenseId = transferId)
    await db.delete(expenses).where(eq(expenses.parentExpenseId, id));

    // Reverter os saldos das contas
    const amount = parseFloat(transfer.amount);
    
    // Reverter débito na conta origem (adicionar o valor de volta)
    await db
      .update(bankAccounts)
      .set({ balance: sql`balance + ${amount}` })
      .where(eq(bankAccounts.id, transfer.fromAccountId));
    
    // Reverter crédito na conta destino (subtrair o valor)
    await db
      .update(bankAccounts)
      .set({ balance: sql`balance - ${amount}` })
      .where(eq(bankAccounts.id, transfer.toAccountId));

    // Recalcular saldos calculados
    await this.recalculateAccountBalance(transfer.userId, transfer.fromAccountId);
    await this.recalculateAccountBalance(transfer.userId, transfer.toAccountId);

    // Finalmente, deletar a transferência
    await db.delete(transfers).where(eq(transfers.id, id));
  }

  // Account Balances Methods
  async getAccountBalance(userId: number, accountId: number): Promise<AccountBalance | undefined> {
    const [balance] = await db
      .select()
      .from(accountBalances)
      .where(and(
        eq(accountBalances.userId, userId),
        eq(accountBalances.accountId, accountId)
      ))
      .limit(1);
    
    return balance;
  }

  async updateAccountBalance(userId: number, accountId: number, newBalance: string): Promise<void> {
    // Primeiro, tentar atualizar se já existe
    const updateResult = await db
      .update(accountBalances)
      .set({ calculatedBalance: newBalance })
      .where(and(
        eq(accountBalances.userId, userId),
        eq(accountBalances.accountId, accountId)
      ));

    // Se não atualizou nenhuma linha, inserir nova
    if (updateResult.affectedRows === 0) {
      await db
        .insert(accountBalances)
        .values({
          userId,
          accountId,
          calculatedBalance: newBalance
        });
    }
  }

  async initializeAccountBalance(userId: number, accountId: number): Promise<void> {
    // Calcular saldo inicial baseado no saldo da conta + movimentações
    const calculatedBalance = await this.calculateAccountBalance(userId, accountId);
    await this.updateAccountBalance(userId, accountId, calculatedBalance);
  }

  async calculateAccountBalance(userId: number, accountId: number): Promise<string> {
    // Buscar saldo inicial da conta
    const account = await this.getBankAccountById(accountId);
    if (!account) {
      return "0.00";
    }

    const initialBalance = parseFloat(account.balance);

    // Buscar todas as movimentações da conta
    const accountExpenses = await db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        eq(expenses.accountId, accountId)
      ));

    // Separar débitos e créditos
    const debits = accountExpenses
      .filter(exp => exp.transactionType === 'debit' || !exp.transactionType)
      .reduce((sum: number, exp: Expense) => sum + parseFloat(exp.amount), 0);

    const credits = accountExpenses
      .filter(exp => exp.transactionType === 'credit')
      .reduce((sum: number, exp: Expense) => sum + parseFloat(exp.amount), 0);

    // Saldo calculado = Saldo inicial + créditos - débitos
    const calculatedBalance = initialBalance + credits - debits;
    
    return calculatedBalance.toFixed(2);
  }

  async recalculateAccountBalance(userId: number, accountId: number): Promise<void> {
    const newBalance = await this.calculateAccountBalance(userId, accountId);
    await this.updateAccountBalance(userId, accountId, newBalance);
  }
}

// Initialize storage with MySQL database
let storage: IStorage;

const initializeStorage = async () => {
  await databaseInitialization;
  
  if (db) {
    try {
      storage = new DatabaseStorage();
      console.log("✅ Using MySQL external database for persistent data storage");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize database storage:", error);
      throw new Error("Database connection required for application to function");
    }
  }
  
  throw new Error("MySQL database connection is required");
};

// Initialize database storage
initializeStorage();

export { storage };