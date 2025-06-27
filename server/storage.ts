import { User, InsertUser, Category, InsertCategory, BankAccount, InsertBankAccount, Expense, InsertExpense, BillSplit, InsertBillSplit, BillSplitParticipant, InsertBillSplitParticipant, Roommate, InsertRoommate, Goal, InsertGoal, GoalAccount, InsertGoalAccount, Transfer, InsertTransfer, AccountBalance, InsertAccountBalance } from "@shared/schema";

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
  
  // Account Balances (controle de saldos calculados)
  getAccountBalance(userId: number, accountId: number): Promise<AccountBalance | undefined>;
  updateAccountBalance(userId: number, accountId: number, newBalance: string): Promise<void>;
  initializeAccountBalance(userId: number, accountId: number): Promise<void>;
  calculateAccountBalance(userId: number, accountId: number): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private bankAccounts: Map<number, BankAccount>;
  private expenses: Map<number, Expense>;
  private billSplits: Map<number, BillSplit>;
  private billSplitParticipants: Map<number, BillSplitParticipant>;
  private roommates: Map<number, Roommate>;
  private goals: Map<number, Goal>;
  private goalAccounts: Map<number, GoalAccount>;
  private transfers: Map<number, Transfer>;

  private currentIds: {
    users: number;
    categories: number;
    bankAccounts: number;
    expenses: number;
    billSplits: number;
    billSplitParticipants: number;
    roommates: number;
    goals: number;
    goalAccounts: number;
    transfers: number;
  };

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.bankAccounts = new Map();
    this.expenses = new Map();
    this.billSplits = new Map();
    this.billSplitParticipants = new Map();
    this.roommates = new Map();
    this.goals = new Map();
    this.goalAccounts = new Map();
    this.transfers = new Map();

    this.currentIds = {
      users: 1,
      categories: 1,
      bankAccounts: 1,
      expenses: 1,
      billSplits: 1,
      billSplitParticipants: 1,
      roommates: 1,
      goals: 1,
      goalAccounts: 1,
      transfers: 1,
    };

    // Initialize with demo data
    this.initializeDemo();
  }

  private initializeDemo() {
    // Create demo user
    const demoUser: User = {
      id: 1,
      name: "Usuário Demo",
      email: "demo@financecare.com",
      password: "demo123",
      authProvider: "manual",
      profileImageUrl: null,
      createdAt: new Date()
    };
    this.users.set(1, demoUser);
    this.currentIds.users = 2;

    // Create demo categories
    const demoCategories: Category[] = [
      { id: 1, name: "Alimentação", icon: "fas fa-utensils", color: "#EF4444", userId: 1 },
      { id: 2, name: "Transporte", icon: "fas fa-bus", color: "#F59E0B", userId: 1 },
      { id: 3, name: "Lazer", icon: "fas fa-gamepad", color: "#8B5CF6", userId: 1 },
      { id: 4, name: "Saúde", icon: "fas fa-heartbeat", color: "#10B981", userId: 1 },
      { id: 5, name: "Educação", icon: "fas fa-graduation-cap", color: "#3B82F6", userId: 1 },
      { id: 6, name: "Outros", icon: "fas fa-ellipsis-h", color: "#6B7280", userId: 1 },
    ];
    demoCategories.forEach(cat => this.categories.set(cat.id, cat));
    this.currentIds.categories = 7;

    // Create demo bank accounts
    const demoBankAccounts: BankAccount[] = [
      { id: 1, name: "Banco do Brasil", type: "checking", balance: "1245.30", color: "#1E3A8A", lastFourDigits: "1234", userId: 1, isActive: true, sortOrder: 1 },
      { id: 2, name: "Nubank", type: "checking", balance: "892.45", color: "#059669", lastFourDigits: "5678", userId: 1, isActive: true, sortOrder: 2 },
      { id: 3, name: "Poupança", type: "savings", balance: "2850.00", color: "#F59E0B", lastFourDigits: "9012", userId: 1, isActive: true, sortOrder: 3 },
      { id: 4, name: "Conta Antiga", type: "checking", balance: "0.00", color: "#6B7280", lastFourDigits: "3456", userId: 1, isActive: false, sortOrder: 4 },
      { id: 5, name: "Cartão Cancelado", type: "credit", balance: "0.00", color: "#EF4444", lastFourDigits: "7890", userId: 1, isActive: false, sortOrder: 5 },
    ];
    demoBankAccounts.forEach(acc => this.bankAccounts.set(acc.id, acc));
    this.currentIds.bankAccounts = 6;

    // Create demo roommates
    const demoRoommates: Roommate[] = [
      { id: 1, name: "Maria Silva", email: "maria@email.com", phone: "(11) 99999-1111", userId: 1 },
      { id: 2, name: "Pedro Santos", email: "pedro@email.com", phone: "(11) 99999-2222", userId: 1 },
      { id: 3, name: "Ana Costa", email: "ana@email.com", phone: "(11) 99999-3333", userId: 1 },
    ];
    demoRoommates.forEach(roommate => this.roommates.set(roommate.id, roommate));
    this.currentIds.roommates = 4;

    // Create demo goals
    const demoGoals: Goal[] = [
      { id: 1, name: "Viagem para Europa", description: "Economizar para uma viagem de 2 semanas", targetAmount: "15000.00", currentAmount: "3500.00", targetDate: new Date("2024-12-31"), isCompleted: false, color: "#3B82F6", icon: "fas fa-plane", userId: 1, createdAt: new Date() },
      { id: 2, name: "Fundo de Emergência", description: "Reserva de 6 meses de despesas", targetAmount: "18000.00", currentAmount: "4095.75", targetDate: new Date("2024-08-31"), isCompleted: false, color: "#10B981", icon: "fas fa-shield-alt", userId: 1, createdAt: new Date() },
      { id: 3, name: "Notebook Novo", description: "MacBook Pro para trabalho", targetAmount: "8000.00", currentAmount: "892.45", targetDate: new Date("2024-06-30"), isCompleted: false, color: "#6B7280", icon: "fas fa-laptop", userId: 1, createdAt: new Date() }
    ];
    demoGoals.forEach(goal => this.goals.set(goal.id, goal));
    this.currentIds.goals = 4;

    // Create demo goal accounts (linking goals to accounts)
    const demoGoalAccounts: GoalAccount[] = [
      { id: 1, goalId: 1, accountId: 3 }, // Viagem -> Poupança
      { id: 2, goalId: 2, accountId: 3 }, // Emergência -> Poupança  
      { id: 3, goalId: 2, accountId: 1 }, // Emergência -> Banco do Brasil
      { id: 4, goalId: 3, accountId: 2 }  // Notebook -> Nubank
    ];
    demoGoalAccounts.forEach(ga => this.goalAccounts.set(ga.id, ga));
    this.currentIds.goalAccounts = 5;

    // Create comprehensive demo expenses
    const demoExpenses: Expense[] = [
      // Recent expenses (this month)
      { id: 1, description: "Supermercado Extra", amount: "245.67", date: new Date("2025-06-25"), categoryId: 1, accountId: 1, userId: 1, createdAt: new Date("2025-06-25"), isRecurring: false, recurringType: null, recurringFrequency: null, recurringInterval: null, installmentTotal: null, installmentCurrent: null, recurringEndDate: null, parentExpenseId: null },
      { id: 2, description: "Posto de Gasolina", amount: "89.50", date: new Date("2025-06-24"), categoryId: 2, accountId: 2, userId: 1, createdAt: new Date("2025-06-24") },
      { id: 3, description: "Farmácia Drogasil", amount: "45.20", date: new Date("2025-06-23"), categoryId: 3, accountId: 1, userId: 1, createdAt: new Date("2025-06-23") },
      { id: 4, description: "Netflix", amount: "39.90", date: new Date("2025-06-22"), categoryId: 4, accountId: 2, userId: 1, createdAt: new Date("2025-06-22") },
      { id: 5, description: "Uber", amount: "25.40", date: new Date("2025-06-21"), categoryId: 2, accountId: 2, userId: 1, createdAt: new Date("2025-06-21") },
      { id: 6, description: "Padaria do João", amount: "12.50", date: new Date("2025-06-20"), categoryId: 1, accountId: 1, userId: 1, createdAt: new Date("2025-06-20") },
      { id: 7, description: "Shopping Iguatemi", amount: "156.80", date: new Date("2025-06-19"), categoryId: 5, accountId: 1, userId: 1, createdAt: new Date("2025-06-19") },
      { id: 8, description: "Academia Smart Fit", amount: "49.90", date: new Date("2025-06-18"), categoryId: 6, accountId: 2, userId: 1, createdAt: new Date("2025-06-18") },
      
      // Previous month expenses
      { id: 9, description: "Conta de Luz", amount: "189.45", date: new Date("2025-05-15"), categoryId: 1, accountId: 1, userId: 1, createdAt: new Date("2025-05-15") },
      { id: 10, description: "Supermercado Carrefour", amount: "312.88", date: new Date("2025-05-14"), categoryId: 1, accountId: 1, userId: 1, createdAt: new Date("2025-05-14") },
      { id: 11, description: "Posto Shell", amount: "95.20", date: new Date("2025-05-13"), categoryId: 2, accountId: 2, userId: 1, createdAt: new Date("2025-05-13") },
      { id: 12, description: "Restaurante Outback", amount: "185.60", date: new Date("2025-05-12"), categoryId: 1, accountId: 1, userId: 1, createdAt: new Date("2025-05-12") },
      { id: 13, description: "Spotify Premium", date: new Date("2025-05-10"), amount: "19.90", categoryId: 4, accountId: 2, userId: 1, createdAt: new Date("2025-05-10") },
      { id: 14, description: "Zara", amount: "298.50", date: new Date("2025-05-08"), categoryId: 5, accountId: 1, userId: 1, createdAt: new Date("2025-05-08") },
      { id: 15, description: "Dentista", amount: "380.00", date: new Date("2025-05-05"), categoryId: 3, accountId: 1, userId: 1, createdAt: new Date("2025-05-05") },
      
      // Older expenses
      { id: 16, description: "iFood - Pizza", amount: "67.40", date: new Date("2025-04-28"), categoryId: 1, accountId: 2, userId: 1, createdAt: new Date("2025-04-28") },
      { id: 17, description: "Combustível", amount: "78.90", date: new Date("2025-04-25"), categoryId: 2, accountId: 2, userId: 1, createdAt: new Date("2025-04-25") },
      { id: 18, description: "Livros Amazon", amount: "129.90", date: new Date("2025-04-20"), categoryId: 6, accountId: 1, userId: 1, createdAt: new Date("2025-04-20") },
      { id: 19, description: "Cinema", amount: "45.00", date: new Date("2025-04-15"), categoryId: 4, accountId: 2, userId: 1, createdAt: new Date("2025-04-15") },
      { id: 20, description: "Mercado Municipal", amount: "87.35", date: new Date("2025-04-10"), categoryId: 1, accountId: 1, userId: 1, createdAt: new Date("2025-04-10") }
    ];
    demoExpenses.forEach(expense => this.expenses.set(expense.id, expense));
    this.currentIds.expenses = 21;

    // Create demo bill splits
    const demoBillSplits: BillSplit[] = [
      { id: 1, title: "Churrasco Fim de Semana", description: "Churrasco na casa do Pedro", totalAmount: "280.00", createdBy: 1, createdAt: new Date("2025-06-22") },
      { id: 2, title: "Conta do Restaurante", description: "Jantar no restaurante italiano", totalAmount: "195.60", createdBy: 1, createdAt: new Date("2025-06-18") },
      { id: 3, title: "Uber Compartilhado", description: "Viagem para o aeroporto", totalAmount: "45.80", createdBy: 1, createdAt: new Date("2025-06-15") }
    ];
    demoBillSplits.forEach(split => this.billSplits.set(split.id, split));
    this.currentIds.billSplits = 4;

    // Create demo bill split participants
    const demoBillSplitParticipants: BillSplitParticipant[] = [
      // Churrasco participants
      { id: 1, billSplitId: 1, userId: 1, amount: "70.00", isPaid: true, paidAt: new Date("2025-06-22") },
      { id: 2, billSplitId: 1, userId: 2, amount: "70.00", isPaid: true, paidAt: new Date("2025-06-22") },
      { id: 3, billSplitId: 1, userId: 3, amount: "70.00", isPaid: false, paidAt: null },
      { id: 4, billSplitId: 1, userId: 1, amount: "70.00", isPaid: false, paidAt: null },
      
      // Restaurante participants  
      { id: 5, billSplitId: 2, userId: 1, amount: "65.20", isPaid: true, paidAt: new Date("2025-06-18") },
      { id: 6, billSplitId: 2, userId: 2, amount: "65.20", isPaid: true, paidAt: new Date("2025-06-19") },
      { id: 7, billSplitId: 2, userId: 3, amount: "65.20", isPaid: false, paidAt: null },
      
      // Uber participants
      { id: 8, billSplitId: 3, userId: 1, amount: "15.27", isPaid: true, paidAt: new Date("2025-06-15") },
      { id: 9, billSplitId: 3, userId: 2, amount: "15.27", isPaid: false, paidAt: null },
      { id: 10, billSplitId: 3, userId: 3, amount: "15.26", isPaid: false, paidAt: null }
    ];
    demoBillSplitParticipants.forEach(participant => this.billSplitParticipants.set(participant.id, participant));
    this.currentIds.billSplitParticipants = 11;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { 
      id,
      name: insertUser.name,
      email: insertUser.email || null,
      password: insertUser.password || null,
      authProvider: "manual",
      profileImageUrl: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Categories
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.userId === userId);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentIds.categories++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  // Bank Accounts
  async getBankAccounts(userId: number): Promise<BankAccount[]> {
    const accounts = Array.from(this.bankAccounts.values()).filter(acc => acc.userId === userId);
    return accounts.sort((a, b) => ((a as any).sortOrder || 0) - ((b as any).sortOrder || 0));
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const id = this.currentIds.bankAccounts++;
    const account: BankAccount = { 
      id,
      name: insertAccount.name,
      type: insertAccount.type,
      color: insertAccount.color,
      userId: insertAccount.userId,
      balance: insertAccount.balance,
      lastFourDigits: insertAccount.lastFourDigits || null,
      isActive: insertAccount.isActive ?? true,
      sortOrder: this.bankAccounts.size + 1
    };
    this.bankAccounts.set(id, account);
    return account;
  }

  async getBankAccountById(id: number): Promise<BankAccount | undefined> {
    return this.bankAccounts.get(id);
  }

  async updateBankAccount(id: number, insertAccount: InsertBankAccount): Promise<BankAccount> {
    const existingAccount = this.bankAccounts.get(id);
    if (!existingAccount) {
      throw new Error("Conta bancária não encontrada");
    }
    
    const updatedAccount: BankAccount = { 
      ...existingAccount,
      ...insertAccount,
      id 
    };
    this.bankAccounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async updateBankAccountBalance(id: number, balance: string): Promise<void> {
    const account = this.bankAccounts.get(id);
    if (account) {
      account.balance = balance;
      this.bankAccounts.set(id, account);
    }
  }

  async updateBankAccountsOrder(accountIds: number[]): Promise<void> {
    // In memory storage - just update the order in memory
    const accounts = Array.from(this.bankAccounts.values());
    accountIds.forEach((id, index) => {
      const account = this.bankAccounts.get(id);
      if (account) {
        (account as any).sortOrder = index;
      }
    });
  }

  async deleteBankAccount(id: number): Promise<void> {
    this.bankAccounts.delete(id);
  }

  // Expenses
  async getExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(exp => exp.userId === userId);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentIds.expenses++;
    const expense: Expense = { 
      ...insertExpense, 
      id,
      createdAt: new Date(),
      isRecurring: insertExpense.isRecurring ?? false,
      recurringType: insertExpense.recurringType ?? null,
      recurringFrequency: insertExpense.recurringFrequency ?? null,
      recurringInterval: insertExpense.recurringInterval ?? null,
      installmentTotal: insertExpense.installmentTotal ?? null,
      installmentCurrent: insertExpense.installmentCurrent ?? null,
      recurringEndDate: insertExpense.recurringEndDate ?? null,
      parentExpenseId: insertExpense.parentExpenseId ?? null,
    };
    this.expenses.set(id, expense);

    // Handle installment creation
    if (insertExpense.isRecurring && insertExpense.recurringType === "installment" && insertExpense.installmentTotal) {
      const installmentAmount = (parseFloat(insertExpense.amount) / insertExpense.installmentTotal).toFixed(2);
      
      for (let i = 1; i < insertExpense.installmentTotal; i++) {
        const installmentDate = new Date(insertExpense.date);
        installmentDate.setMonth(installmentDate.getMonth() + i);
        
        const installmentId = this.currentIds.expenses++;
        const installmentExpense: Expense = {
          ...insertExpense,
          id: installmentId,
          amount: installmentAmount,
          date: installmentDate,
          createdAt: new Date(),
          installmentCurrent: i + 1,
          parentExpenseId: id,
          isRecurring: true,
          recurringType: "installment",
          recurringFrequency: null,
          recurringInterval: null,
          recurringEndDate: null,
        };
        this.expenses.set(installmentId, installmentExpense);
      }
      
      // Update original expense with installment details
      expense.amount = installmentAmount;
      expense.installmentCurrent = 1;
      this.expenses.set(id, expense);
    }

    return expense;
  }

  async getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(exp => 
      exp.userId === userId && exp.date >= startDate && exp.date <= endDate
    );
  }

  async getExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(exp => 
      exp.userId === userId && exp.categoryId === categoryId
    );
  }

  async updateExpense(id: number, insertExpense: InsertExpense): Promise<Expense | undefined> {
    const existingExpense = this.expenses.get(id);
    if (!existingExpense) {
      return undefined;
    }

    const updatedExpense: Expense = {
      ...existingExpense,
      ...insertExpense,
      id: existingExpense.id,
      createdAt: existingExpense.createdAt,
      isRecurring: insertExpense.isRecurring ?? false,
      recurringType: insertExpense.recurringType ?? null,
      recurringFrequency: insertExpense.recurringFrequency ?? null,
      recurringInterval: insertExpense.recurringInterval ?? null,
      installmentTotal: insertExpense.installmentTotal ?? null,
      installmentCurrent: insertExpense.installmentCurrent ?? null,
      recurringEndDate: insertExpense.recurringEndDate ?? null,
      parentExpenseId: insertExpense.parentExpenseId ?? null,
    };

    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    this.expenses.delete(id);
  }

  // Bill Splits
  async getBillSplits(userId: number): Promise<BillSplit[]> {
    return Array.from(this.billSplits.values()).filter(split => split.createdBy === userId);
  }

  async createBillSplit(insertBillSplit: InsertBillSplit): Promise<BillSplit> {
    const id = this.currentIds.billSplits++;
    const billSplit: BillSplit = { 
      id,
      title: insertBillSplit.title,
      description: insertBillSplit.description || null,
      totalAmount: insertBillSplit.totalAmount,
      createdBy: insertBillSplit.createdBy,
      createdAt: new Date()
    };
    this.billSplits.set(id, billSplit);
    return billSplit;
  }

  async getBillSplitById(id: number): Promise<BillSplit | undefined> {
    return this.billSplits.get(id);
  }

  async getBillSplitParticipants(billSplitId: number): Promise<BillSplitParticipant[]> {
    return Array.from(this.billSplitParticipants.values()).filter(p => p.billSplitId === billSplitId);
  }

  async createBillSplitParticipant(insertParticipant: InsertBillSplitParticipant): Promise<BillSplitParticipant> {
    const id = this.currentIds.billSplitParticipants++;
    const participant: BillSplitParticipant = { 
      id,
      billSplitId: insertParticipant.billSplitId,
      userId: insertParticipant.userId,
      amount: insertParticipant.amount,
      isPaid: insertParticipant.isPaid || null,
      paidAt: null
    };
    this.billSplitParticipants.set(id, participant);
    return participant;
  }

  async updateParticipantPaymentStatus(id: number, isPaid: boolean): Promise<void> {
    const participant = this.billSplitParticipants.get(id);
    if (participant) {
      participant.isPaid = isPaid;
      participant.paidAt = isPaid ? new Date() : null;
      this.billSplitParticipants.set(id, participant);
    }
  }

  // Roommates
  async getRoommates(userId: number): Promise<Roommate[]> {
    return Array.from(this.roommates.values()).filter(r => r.userId === userId);
  }

  async createRoommate(insertRoommate: InsertRoommate): Promise<Roommate> {
    const id = this.currentIds.roommates++;
    const roommate: Roommate = { ...insertRoommate, id };
    this.roommates.set(id, roommate);
    return roommate;
  }

  // Goals
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(g => g.userId === userId);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.currentIds.goals++;
    const goal: Goal = { 
      ...insertGoal, 
      id,
      currentAmount: "0.00",
      isCompleted: false,
      createdAt: new Date()
    };
    this.goals.set(id, goal);
    return goal;
  }

  async getGoalById(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async updateGoalProgress(id: number, currentAmount: string): Promise<void> {
    const goal = this.goals.get(id);
    if (goal) {
      goal.currentAmount = currentAmount;
      this.goals.set(id, goal);
    }
  }

  async deleteGoal(id: number): Promise<void> {
    this.goals.delete(id);
  }

  async getGoalAccounts(goalId: number): Promise<GoalAccount[]> {
    return Array.from(this.goalAccounts.values()).filter(ga => ga.goalId === goalId);
  }

  async addAccountToGoal(insertGoalAccount: InsertGoalAccount): Promise<GoalAccount> {
    const id = this.currentIds.goalAccounts++;
    const goalAccount: GoalAccount = { ...insertGoalAccount, id };
    this.goalAccounts.set(id, goalAccount);
    return goalAccount;
  }

  async removeAccountFromGoal(goalId: number, accountId: number): Promise<void> {
    const goalAccount = Array.from(this.goalAccounts.values())
      .find(ga => ga.goalId === goalId && ga.accountId === accountId);
    if (goalAccount) {
      this.goalAccounts.delete(goalAccount.id);
    }
  }

  // Transfers
  async getTransfers(userId: number): Promise<Transfer[]> {
    return Array.from(this.transfers.values()).filter(t => t.userId === userId);
  }

  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const id = this.currentIds.transfers++;
    const transfer: Transfer = { 
      ...insertTransfer, 
      id,
      createdAt: new Date(),
      date: new Date(insertTransfer.date)
    };
    this.transfers.set(id, transfer);
    
    // Update account balances
    const fromAccount = this.bankAccounts.get(insertTransfer.fromAccountId);
    const toAccount = this.bankAccounts.get(insertTransfer.toAccountId);
    
    if (fromAccount && toAccount) {
      const amount = parseFloat(insertTransfer.amount);
      fromAccount.balance = (parseFloat(fromAccount.balance) - amount).toFixed(2);
      toAccount.balance = (parseFloat(toAccount.balance) + amount).toFixed(2);
    }
    
    return transfer;
  }

  async getTransferById(id: number): Promise<Transfer | undefined> {
    return this.transfers.get(id);
  }
}

import { db, isDatabaseAvailable, databaseInitialization } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { 
  users, categories, bankAccounts, expenses, billSplits, billSplitParticipants, 
  roommates, goals, goalAccounts, transfers 
} from "@shared/schema";
import bcrypt from "bcrypt";

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
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        authProvider: "local",
      })
      .returning();
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Categories
  async getCategories(userId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db
      .insert(categories)
      .values(insertCategory);
    
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, result.insertId))
      .limit(1);
      
    return category;
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  // Bank Accounts
  async getBankAccounts(userId: number): Promise<BankAccount[]> {
    const accounts = await db.select().from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .orderBy(bankAccounts.sortOrder);
    
    // Sort: active accounts first (by sortOrder), then inactive accounts
    return accounts.sort((a: BankAccount, b: BankAccount) => {
      // If both accounts have the same active status, sort by sortOrder
      if ((a.isActive !== false) === (b.isActive !== false)) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      // Active accounts come before inactive accounts
      if (a.isActive !== false && b.isActive === false) return -1;
      if (a.isActive === false && b.isActive !== false) return 1;
      return 0;
    });
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const result = await db
      .insert(bankAccounts)
      .values(insertAccount);
    
    // Get the inserted account by ID
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, result.insertId))
      .limit(1);
      
    return account;
  }

  async getBankAccountById(id: number): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account || undefined;
  }

  async updateBankAccount(id: number, insertAccount: InsertBankAccount): Promise<BankAccount> {
    await db
      .update(bankAccounts)
      .set(insertAccount)
      .where(eq(bankAccounts.id, id));
    
    const [updatedAccount] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, id))
      .limit(1);
      
    return updatedAccount;
  }

  async updateBankAccountBalance(id: number, balance: string): Promise<void> {
    await db
      .update(bankAccounts)
      .set({ balance })
      .where(eq(bankAccounts.id, id));
  }

  async updateBankAccountsOrder(accountIds: number[]): Promise<void> {
    // Update each account's sort order
    for (let i = 0; i < accountIds.length; i++) {
      await db
        .update(bankAccounts)
        .set({ sortOrder: i })
        .where(eq(bankAccounts.id, accountIds[i]));
    }
  }

  async deleteBankAccount(id: number): Promise<void> {
    await db
      .delete(bankAccounts)
      .where(eq(bankAccounts.id, id));
  }

  // Expenses
  async getExpenses(userId: number): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    // Prepare data with default values for optional fields
    const expenseData = {
      ...insertExpense,
      isRecurring: insertExpense.isRecurring || false,
      recurringType: insertExpense.recurringType || null,
      recurringFrequency: insertExpense.recurringFrequency || null,
      recurringInterval: insertExpense.recurringInterval || null,
      installmentTotal: insertExpense.installmentTotal || null,
      installmentCurrent: insertExpense.installmentCurrent || null,
      recurringEndDate: insertExpense.recurringEndDate || null,
      parentExpenseId: insertExpense.parentExpenseId || null,
    };

    const result = await db
      .insert(expenses)
      .values(expenseData);
    
    // MySQL com Drizzle retorna insertId no formato diferente
    const insertId = result[0]?.insertId || result.insertId;
    
    if (!insertId) {
      throw new Error("Falha ao criar despesa - ID não retornado");
    }
    
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, Number(insertId)))
      .limit(1);
      
    if (!expense) {
      throw new Error("Falha ao buscar despesa criada");
    }
      
    return expense;
  }

  async getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate)
        )
      );
  }

  async getExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.categoryId, categoryId)
        )
      );
  }

  async updateExpense(id: number, insertExpense: InsertExpense): Promise<Expense | undefined> {
    const expenseData = {
      ...insertExpense,
      isRecurring: insertExpense.isRecurring || false,
      recurringType: insertExpense.recurringType || null,
      recurringFrequency: insertExpense.recurringFrequency || null,
      recurringInterval: insertExpense.recurringInterval || null,
      installmentTotal: insertExpense.installmentTotal || null,
      installmentCurrent: insertExpense.installmentCurrent || null,
      recurringEndDate: insertExpense.recurringEndDate || null,
      parentExpenseId: insertExpense.parentExpenseId || null,
    };

    await db
      .update(expenses)
      .set(expenseData)
      .where(eq(expenses.id, id));

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);

    return expense || undefined;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Bill Splits
  async getBillSplits(userId: number): Promise<BillSplit[]> {
    return await db.select().from(billSplits).where(eq(billSplits.createdBy, userId));
  }

  async createBillSplit(insertBillSplit: InsertBillSplit): Promise<BillSplit> {
    const result = await db
      .insert(billSplits)
      .values(insertBillSplit);
    
    const [billSplit] = await db
      .select()
      .from(billSplits)
      .where(eq(billSplits.id, result.insertId))
      .limit(1);
      
    return billSplit;
  }

  async getBillSplitById(id: number): Promise<BillSplit | undefined> {
    const [billSplit] = await db.select().from(billSplits).where(eq(billSplits.id, id));
    return billSplit || undefined;
  }

  async getBillSplitParticipants(billSplitId: number): Promise<BillSplitParticipant[]> {
    return await db
      .select()
      .from(billSplitParticipants)
      .where(eq(billSplitParticipants.billSplitId, billSplitId));
  }

  async createBillSplitParticipant(insertParticipant: InsertBillSplitParticipant): Promise<BillSplitParticipant> {
    const result = await db
      .insert(billSplitParticipants)
      .values(insertParticipant);
    
    const [participant] = await db
      .select()
      .from(billSplitParticipants)
      .where(eq(billSplitParticipants.id, result.insertId))
      .limit(1);
      
    return participant;
  }

  async updateParticipantPaymentStatus(id: number, isPaid: boolean): Promise<void> {
    await db
      .update(billSplitParticipants)
      .set({ 
        isPaid, 
        paidAt: isPaid ? new Date() : null 
      })
      .where(eq(billSplitParticipants.id, id));
  }

  // Roommates
  async getRoommates(userId: number): Promise<Roommate[]> {
    return await db.select().from(roommates).where(eq(roommates.userId, userId));
  }

  async createRoommate(insertRoommate: InsertRoommate): Promise<Roommate> {
    const result = await db
      .insert(roommates)
      .values(insertRoommate);
    
    const [roommate] = await db
      .select()
      .from(roommates)
      .where(eq(roommates.id, result.insertId))
      .limit(1);
      
    return roommate;
  }

  // Goals
  async getGoals(userId: number): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const result = await db
      .insert(goals)
      .values({
        ...insertGoal,
        currentAmount: "0",
        isCompleted: false,
      });
    
    const [goal] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, result.insertId))
      .limit(1);
      
    return goal;
  }

  async getGoalById(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async updateGoalProgress(id: number, currentAmount: string): Promise<void> {
    await db
      .update(goals)
      .set({ currentAmount })
      .where(eq(goals.id, id));
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Goal Accounts
  async getGoalAccounts(goalId: number): Promise<GoalAccount[]> {
    return await db.select().from(goalAccounts).where(eq(goalAccounts.goalId, goalId));
  }

  async addAccountToGoal(insertGoalAccount: InsertGoalAccount): Promise<GoalAccount> {
    const result = await db
      .insert(goalAccounts)
      .values(insertGoalAccount);
    
    const [goalAccount] = await db
      .select()
      .from(goalAccounts)
      .where(eq(goalAccounts.id, result.insertId))
      .limit(1);
      
    return goalAccount;
  }

  async removeAccountFromGoal(goalId: number, accountId: number): Promise<void> {
    await db
      .delete(goalAccounts)
      .where(
        and(
          eq(goalAccounts.goalId, goalId),
          eq(goalAccounts.accountId, accountId)
        )
      );
  }

  // Transfers
  async getTransfers(userId: number): Promise<Transfer[]> {
    return await db.select().from(transfers).where(eq(transfers.userId, userId)).orderBy(desc(transfers.date));
  }

  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const result = await db
      .insert(transfers)
      .values(insertTransfer);
    
    // Update account balances
    const amount = parseFloat(insertTransfer.amount);
    
    await db
      .update(bankAccounts)
      .set({ balance: sql`balance - ${amount}` })
      .where(eq(bankAccounts.id, insertTransfer.fromAccountId));
    
    await db
      .update(bankAccounts)
      .set({ balance: sql`balance + ${amount}` })
      .where(eq(bankAccounts.id, insertTransfer.toAccountId));
    
    const [transfer] = await db
      .select()
      .from(transfers)
      .where(eq(transfers.id, result.insertId))
      .limit(1);
      
    return transfer;
  }

  async getTransferById(id: number): Promise<Transfer | undefined> {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, id));
    return transfer || undefined;
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

// Start with temporary storage, then switch to database when ready
storage = new MemStorage();
initializeStorage();

export { storage };