import { eq, and } from 'drizzle-orm';
import { getDb, schema } from './db.js';
import type { 
  User, NewUser, Category, NewCategory, BankAccount, NewBankAccount,
  Expense, NewExpense, Roommate, NewRoommate, BillSplit, NewBillSplit,
  Goal, NewGoal, GoalAccount, NewGoalAccount 
} from '@shared/schema';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: NewUser): Promise<User>;
  
  // Categories
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: NewCategory): Promise<Category>;
  
  // Bank Accounts
  getBankAccounts(userId: string): Promise<BankAccount[]>;
  createBankAccount(account: NewBankAccount): Promise<BankAccount>;
  updateBankAccountBalance(id: string, balance: string): Promise<void>;
  
  // Expenses
  getExpenses(userId: string): Promise<(Expense & { category: Category; account: BankAccount })[]>;
  createExpense(expense: NewExpense): Promise<Expense>;
  
  // Roommates
  getRoommates(userId: string): Promise<Roommate[]>;
  createRoommate(roommate: NewRoommate): Promise<Roommate>;
  
  // Bill Splits
  getBillSplits(userId: string): Promise<BillSplit[]>;
  createBillSplit(billSplit: NewBillSplit): Promise<BillSplit>;
  updateBillSplit(id: string, billSplit: Partial<BillSplit>): Promise<BillSplit>;
  
  // Goals
  getGoals(userId: string): Promise<(Goal & { accounts: BankAccount[] })[]>;
  createGoal(goal: NewGoal): Promise<Goal>;
  
  // Goal Accounts
  createGoalAccount(goalAccount: NewGoalAccount): Promise<GoalAccount>;
  removeGoalAccount(goalId: string, accountId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private db = getDb();

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: NewUser): Promise<User> {
    const result = await this.db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async getCategories(userId: string): Promise<Category[]> {
    return await this.db.select().from(schema.categories).where(eq(schema.categories.userId, userId));
  }

  async createCategory(category: NewCategory): Promise<Category> {
    const result = await this.db.insert(schema.categories).values(category).returning();
    return result[0];
  }

  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    return await this.db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.userId, userId));
  }

  async createBankAccount(account: NewBankAccount): Promise<BankAccount> {
    const result = await this.db.insert(schema.bankAccounts).values(account).returning();
    return result[0];
  }

  async updateBankAccountBalance(id: string, balance: string): Promise<void> {
    await this.db.update(schema.bankAccounts).set({ balance }).where(eq(schema.bankAccounts.id, id));
  }

  async getExpenses(userId: string): Promise<(Expense & { category: Category; account: BankAccount })[]> {
    return await this.db
      .select({
        id: schema.expenses.id,
        amount: schema.expenses.amount,
        description: schema.expenses.description,
        date: schema.expenses.date,
        categoryId: schema.expenses.categoryId,
        accountId: schema.expenses.accountId,
        userId: schema.expenses.userId,
        category: schema.categories,
        account: schema.bankAccounts,
      })
      .from(schema.expenses)
      .innerJoin(schema.categories, eq(schema.expenses.categoryId, schema.categories.id))
      .innerJoin(schema.bankAccounts, eq(schema.expenses.accountId, schema.bankAccounts.id))
      .where(eq(schema.expenses.userId, userId));
  }

  async createExpense(expense: NewExpense): Promise<Expense> {
    const result = await this.db.insert(schema.expenses).values(expense).returning();
    return result[0];
  }

  async getRoommates(userId: string): Promise<Roommate[]> {
    return await this.db.select().from(schema.roommates).where(eq(schema.roommates.userId, userId));
  }

  async createRoommate(roommate: NewRoommate): Promise<Roommate> {
    const result = await this.db.insert(schema.roommates).values(roommate).returning();
    return result[0];
  }

  async getBillSplits(userId: string): Promise<BillSplit[]> {
    return await this.db.select().from(schema.billSplits).where(eq(schema.billSplits.userId, userId));
  }

  async createBillSplit(billSplit: NewBillSplit): Promise<BillSplit> {
    const result = await this.db.insert(schema.billSplits).values(billSplit).returning();
    return result[0];
  }

  async updateBillSplit(id: string, billSplit: Partial<BillSplit>): Promise<BillSplit> {
    const result = await this.db.update(schema.billSplits).set(billSplit).where(eq(schema.billSplits.id, id)).returning();
    return result[0];
  }

  async getGoals(userId: string): Promise<(Goal & { accounts: BankAccount[] })[]> {
    const goals = await this.db.select().from(schema.goals).where(eq(schema.goals.userId, userId));
    
    const goalsWithAccounts = await Promise.all(
      goals.map(async (goal) => {
        const accounts = await this.db
          .select({ account: schema.bankAccounts })
          .from(schema.goalAccounts)
          .innerJoin(schema.bankAccounts, eq(schema.goalAccounts.accountId, schema.bankAccounts.id))
          .where(eq(schema.goalAccounts.goalId, goal.id));
        
        return {
          ...goal,
          accounts: accounts.map(a => a.account),
        };
      })
    );
    
    return goalsWithAccounts;
  }

  async createGoal(goal: NewGoal): Promise<Goal> {
    const result = await this.db.insert(schema.goals).values(goal).returning();
    return result[0];
  }

  async createGoalAccount(goalAccount: NewGoalAccount): Promise<GoalAccount> {
    const result = await this.db.insert(schema.goalAccounts).values(goalAccount).returning();
    return result[0];
  }

  async removeGoalAccount(goalId: string, accountId: string): Promise<void> {
    await this.db.delete(schema.goalAccounts)
      .where(and(eq(schema.goalAccounts.goalId, goalId), eq(schema.goalAccounts.accountId, accountId)));
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage();