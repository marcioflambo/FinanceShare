import {
  users, categories, bankAccounts, expenses, billSplits, billSplitParticipants, roommates, goals, goalAccounts,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type BankAccount, type InsertBankAccount,
  type Expense, type InsertExpense,
  type BillSplit, type InsertBillSplit,
  type BillSplitParticipant, type InsertBillSplitParticipant,
  type Roommate, type InsertRoommate,
  type Goal, type InsertGoal,
  type GoalAccount, type InsertGoalAccount
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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
      username: "demo",
      password: "demo123",
      name: "Usuário Demo",
      email: "demo@financecare.com"
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
    demoRoommates.forEach(rm => this.roommates.set(rm.id, rm));
    this.currentIds.roommates = 4;

    // Create demo goals
    const demoGoals: Goal[] = [
      { 
        id: 1, 
        name: "Viagem para Europa", 
        description: "Economizar para uma viagem de 15 dias pela Europa", 
        targetAmount: "15000.00", 
        currentAmount: "0.00", 
        targetDate: new Date(2025, 11, 31), 
        isCompleted: false, 
        color: "#3B82F6", 
        icon: "fas fa-plane", 
        userId: 1, 
        createdAt: new Date() 
      },
      { 
        id: 2, 
        name: "Reserva de Emergência", 
        description: "Meta de ter 6 meses de gastos guardados", 
        targetAmount: "12000.00", 
        currentAmount: "0.00", 
        targetDate: new Date(2025, 5, 30), 
        isCompleted: false, 
        color: "#EF4444", 
        icon: "fas fa-shield-alt", 
        userId: 1, 
        createdAt: new Date() 
      },
      { 
        id: 3, 
        name: "Novo Notebook", 
        description: "Comprar um notebook para trabalho", 
        targetAmount: "4500.00", 
        currentAmount: "0.00", 
        targetDate: new Date(2025, 2, 28), 
        isCompleted: false, 
        color: "#8B5CF6", 
        icon: "fas fa-laptop", 
        userId: 1, 
        createdAt: new Date() 
      }
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
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
    return Array.from(this.expenses.values()).filter(expense => expense.userId === userId);
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
    return Array.from(this.expenses.values()).filter(expense => 
      expense.userId === userId &&
      expense.date >= startDate &&
      expense.date <= endDate
    );
  }

  async getExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => 
      expense.userId === userId && expense.categoryId === categoryId
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
      paidAt: insertParticipant.isPaid ? new Date() : null
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
    return Array.from(this.roommates.values()).filter(rm => rm.userId === userId);
  }

  async createRoommate(insertRoommate: InsertRoommate): Promise<Roommate> {
    const id = this.currentIds.roommates++;
    const roommate: Roommate = { ...insertRoommate, id };
    this.roommates.set(id, roommate);
    return roommate;
  }

  // Goals
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
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
      goal.isCompleted = parseFloat(currentAmount) >= parseFloat(goal.targetAmount);
      this.goals.set(id, goal);
    }
  }

  async deleteGoal(id: number): Promise<void> {
    this.goals.delete(id);
    // Remove associated goal accounts
    const goalAccounts = Array.from(this.goalAccounts.values()).filter(ga => ga.goalId === id);
    goalAccounts.forEach(ga => this.goalAccounts.delete(ga.id));
  }

  // Goal Accounts
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

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        email: insertUser.email || null
      })
      .returning();
    return user;
  }

  async getCategories(userId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getBankAccounts(userId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const [account] = await db
      .insert(bankAccounts)
      .values({
        ...insertAccount,
        lastFourDigits: insertAccount.lastFourDigits || null
      })
      .returning();
    return account;
  }

  async getBankAccountById(id: number): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account || undefined;
  }

  async updateBankAccountBalance(id: number, balance: string): Promise<void> {
    await db.update(bankAccounts)
      .set({ balance })
      .where(eq(bankAccounts.id, id));
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db.select().from(expenses).where(
      and(
        eq(expenses.userId, userId),
        // Add date range filtering here when needed
      )
    );
  }

  async getExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(
      and(
        eq(expenses.userId, userId),
        eq(expenses.categoryId, categoryId)
      )
    );
  }

  async getBillSplits(userId: number): Promise<BillSplit[]> {
    return await db.select().from(billSplits).where(eq(billSplits.createdBy, userId));
  }

  async createBillSplit(insertBillSplit: InsertBillSplit): Promise<BillSplit> {
    const [billSplit] = await db
      .insert(billSplits)
      .values({
        ...insertBillSplit,
        description: insertBillSplit.description || null,
        createdAt: new Date()
      })
      .returning();
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
    const [participant] = await db
      .insert(billSplitParticipants)
      .values({
        ...insertParticipant,
        isPaid: insertParticipant.isPaid || false,
        paidAt: null
      })
      .returning();
    return participant;
  }

  async updateParticipantPaymentStatus(id: number, isPaid: boolean): Promise<void> {
    await db.update(billSplitParticipants)
      .set({ 
        isPaid, 
        paidAt: isPaid ? new Date() : null 
      })
      .where(eq(billSplitParticipants.id, id));
  }

  async getRoommates(userId: number): Promise<Roommate[]> {
    return await db.select().from(roommates).where(eq(roommates.userId, userId));
  }

  async createRoommate(insertRoommate: InsertRoommate): Promise<Roommate> {
    const [roommate] = await db
      .insert(roommates)
      .values({
        ...insertRoommate,
        email: insertRoommate.email || null,
        phone: insertRoommate.phone || null
      })
      .returning();
    return roommate;
  }

  async getGoals(userId: number): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const [goal] = await db
      .insert(goals)
      .values({
        ...insertGoal,
        description: insertGoal.description || null,
        targetDate: insertGoal.targetDate || null,
        createdAt: new Date(),
        currentAmount: "0",
        isCompleted: false
      })
      .returning();
    return goal;
  }

  async getGoalById(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async updateGoalProgress(id: number, currentAmount: string): Promise<void> {
    await db.update(goals)
      .set({ currentAmount })
      .where(eq(goals.id, id));
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goalAccounts).where(eq(goalAccounts.goalId, id));
    await db.delete(goals).where(eq(goals.id, id));
  }

  async getGoalAccounts(goalId: number): Promise<GoalAccount[]> {
    return await db.select().from(goalAccounts).where(eq(goalAccounts.goalId, goalId));
  }

  async addAccountToGoal(insertGoalAccount: InsertGoalAccount): Promise<GoalAccount> {
    const [goalAccount] = await db
      .insert(goalAccounts)
      .values(insertGoalAccount)
      .returning();
    return goalAccount;
  }

  async removeAccountFromGoal(goalId: number, accountId: number): Promise<void> {
    await db.delete(goalAccounts).where(
      and(
        eq(goalAccounts.goalId, goalId),
        eq(goalAccounts.accountId, accountId)
      )
    );
  }
}

export const storage = new DatabaseStorage();
