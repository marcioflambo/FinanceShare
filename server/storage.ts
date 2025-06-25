import { User, InsertUser, Category, InsertCategory, BankAccount, InsertBankAccount, Expense, InsertExpense, BillSplit, InsertBillSplit, BillSplitParticipant, InsertBillSplitParticipant, Roommate, InsertRoommate, Goal, InsertGoal, GoalAccount, InsertGoalAccount } from "@shared/schema";

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
  updateBankAccountBalance(id: number, balance: string): Promise<void>;

  // Expenses
  getExpenses(userId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]>;

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
      { id: 1, name: "Banco do Brasil", type: "checking", balance: "1245.30", color: "#1E3A8A", lastFourDigits: "1234", userId: 1 },
      { id: 2, name: "Nubank", type: "checking", balance: "892.45", color: "#059669", lastFourDigits: "5678", userId: 1 },
      { id: 3, name: "Poupança", type: "savings", balance: "2850.00", color: "#F59E0B", lastFourDigits: "9012", userId: 1 },
    ];
    demoBankAccounts.forEach(acc => this.bankAccounts.set(acc.id, acc));
    this.currentIds.bankAccounts = 4;

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
      ...insertUser, 
      id,
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
    return Array.from(this.bankAccounts.values()).filter(acc => acc.userId === userId);
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const id = this.currentIds.bankAccounts++;
    const account: BankAccount = { ...insertAccount, id };
    this.bankAccounts.set(id, account);
    return account;
  }

  async getBankAccountById(id: number): Promise<BankAccount | undefined> {
    return this.bankAccounts.get(id);
  }

  async updateBankAccountBalance(id: number, balance: string): Promise<void> {
    const account = this.bankAccounts.get(id);
    if (account) {
      account.balance = balance;
      this.bankAccounts.set(id, account);
    }
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
      createdAt: new Date()
    };
    this.expenses.set(id, expense);
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

  // Bill Splits
  async getBillSplits(userId: number): Promise<BillSplit[]> {
    return Array.from(this.billSplits.values()).filter(split => split.createdBy === userId);
  }

  async createBillSplit(insertBillSplit: InsertBillSplit): Promise<BillSplit> {
    const id = this.currentIds.billSplits++;
    const billSplit: BillSplit = { 
      ...insertBillSplit, 
      id,
      date: new Date(),
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
      ...insertParticipant, 
      id,
      paidAt: null,
      createdAt: new Date()
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
}

export const storage = new MemStorage();