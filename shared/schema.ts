import { mysqlTable, text, serial, int, boolean, decimal, timestamp, varchar, json, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).unique(),
  password: text("password"), // For manual registration
  authProvider: varchar("auth_provider", { length: 50 }).default("manual"), // 'google', 'manual'
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  userId: int("user_id").notNull(),
});

export const bankAccounts = mysqlTable("bank_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'checking', 'savings', 'credit'
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  color: text("color").notNull(),
  lastFourDigits: text("last_four_digits"),
  userId: int("user_id").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
});

export const expenses = mysqlTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  categoryId: int("category_id").notNull(),
  accountId: int("account_id").notNull(),
  userId: int("user_id").notNull(),
  transactionType: text("transaction_type").default("debit"), // "debit", "credit", "transfer"
  createdAt: timestamp("created_at").defaultNow(),
  // Recurring transaction fields
  isRecurring: boolean("is_recurring").default(false),
  recurringType: text("recurring_type"), // "none", "installment", "advanced"
  recurringFrequency: text("recurring_frequency"), // "daily", "weekly", "monthly", "yearly"
  recurringInterval: int("recurring_interval").default(1), // every X days/weeks/months/years
  installmentTotal: int("installment_total"), // total installments
  installmentCurrent: int("installment_current"), // current installment number
  recurringEndDate: timestamp("recurring_end_date"),
  parentExpenseId: int("parent_expense_id"), // reference to original expense for installments
});

export const billSplits = mysqlTable("bill_splits", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const billSplitParticipants = mysqlTable("bill_split_participants", {
  id: serial("id").primaryKey(),
  billSplitId: int("bill_split_id").notNull(),
  userId: int("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
});

export const roommates = mysqlTable("roommates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  userId: int("user_id").notNull(),
});

export const goals = mysqlTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  targetDate: timestamp("target_date"),
  isCompleted: boolean("is_completed").default(false),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  userId: int("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalAccounts = mysqlTable("goal_accounts", {
  id: serial("id").primaryKey(),
  goalId: int("goal_id").notNull(),
  accountId: int("account_id").notNull(),
});

export const transfers = mysqlTable("transfers", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  fromAccountId: int("from_account_id").notNull(),
  toAccountId: int("to_account_id").notNull(),
  userId: int("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de controle de saldos calculados por usuário/conta
export const accountBalances = mysqlTable("account_balances", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  accountId: int("account_id").notNull(),
  calculatedBalance: decimal("calculated_balance", { precision: 10, scale: 2 }).notNull().default('0.00'),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  bankAccounts: many(bankAccounts),
  expenses: many(expenses),
  billSplits: many(billSplits),
  billSplitParticipants: many(billSplitParticipants),
  roommates: many(roommates),
  goals: many(goals),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  expenses: many(expenses),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [bankAccounts.userId],
    references: [users.id],
  }),
  expenses: many(expenses),
  goalAccounts: many(goalAccounts),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
  account: one(bankAccounts, {
    fields: [expenses.accountId],
    references: [bankAccounts.id],
  }),
}));

export const billSplitsRelations = relations(billSplits, ({ one, many }) => ({
  creator: one(users, {
    fields: [billSplits.createdBy],
    references: [users.id],
  }),
  participants: many(billSplitParticipants),
}));

export const billSplitParticipantsRelations = relations(billSplitParticipants, ({ one }) => ({
  billSplit: one(billSplits, {
    fields: [billSplitParticipants.billSplitId],
    references: [billSplits.id],
  }),
  user: one(users, {
    fields: [billSplitParticipants.userId],
    references: [users.id],
  }),
}));

export const roommatesRelations = relations(roommates, ({ one }) => ({
  user: one(users, {
    fields: [roommates.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  goalAccounts: many(goalAccounts),
}));

export const goalAccountsRelations = relations(goalAccounts, ({ one }) => ({
  goal: one(goals, {
    fields: [goalAccounts.goalId],
    references: [goals.id],
  }),
  account: one(bankAccounts, {
    fields: [goalAccounts.accountId],
    references: [bankAccounts.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  user: one(users, {
    fields: [transfers.userId],
    references: [users.id],
  }),
  fromAccount: one(bankAccounts, {
    fields: [transfers.fromAccountId],
    references: [bankAccounts.id],
  }),
  toAccount: one(bankAccounts, {
    fields: [transfers.toAccountId],
    references: [bankAccounts.id],
  }),
}));

export const accountBalancesRelations = relations(accountBalances, ({ one }) => ({
  user: one(users, {
    fields: [accountBalances.userId],
    references: [users.id],
  }),
  account: one(bankAccounts, {
    fields: [accountBalances.accountId],
    references: [bankAccounts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const registerUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  color: true,
  userId: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).pick({
  name: true,
  type: true,
  balance: true,
  color: true,
  lastFourDigits: true,
  userId: true,
  isActive: true,
  sortOrder: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  description: true,
  amount: true,
  date: true,
  categoryId: true,
  accountId: true,
  userId: true,
  transactionType: true,
  isRecurring: true,
  recurringType: true,
  recurringFrequency: true,
  recurringInterval: true,
  installmentTotal: true,
  installmentCurrent: true,
  recurringEndDate: true,
  parentExpenseId: true,
});

export const insertBillSplitSchema = createInsertSchema(billSplits).pick({
  title: true,
  totalAmount: true,
  description: true,
  createdBy: true,
});

export const insertBillSplitParticipantSchema = createInsertSchema(billSplitParticipants).pick({
  billSplitId: true,
  userId: true,
  amount: true,
  isPaid: true,
});

export const insertRoommateSchema = createInsertSchema(roommates).pick({
  name: true,
  email: true,
  phone: true,
  userId: true,
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  name: true,
  description: true,
  targetAmount: true,
  targetDate: true,
  color: true,
  icon: true,
  userId: true,
});

export const insertGoalAccountSchema = createInsertSchema(goalAccounts).pick({
  goalId: true,
  accountId: true,
});

export const insertTransferSchema = createInsertSchema(transfers).pick({
  description: true,
  amount: true,
  date: true,
  fromAccountId: true,
  toAccountId: true,
  userId: true,
});

export const insertAccountBalanceSchema = createInsertSchema(accountBalances).pick({
  userId: true,
  accountId: true,
  calculatedBalance: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type BillSplit = typeof billSplits.$inferSelect;
export type InsertBillSplit = z.infer<typeof insertBillSplitSchema>;

export type BillSplitParticipant = typeof billSplitParticipants.$inferSelect;
export type InsertBillSplitParticipant = z.infer<typeof insertBillSplitParticipantSchema>;

export type Roommate = typeof roommates.$inferSelect;
export type InsertRoommate = z.infer<typeof insertRoommateSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type GoalAccount = typeof goalAccounts.$inferSelect;
export type InsertGoalAccount = z.infer<typeof insertGoalAccountSchema>;

export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;

export type AccountBalance = typeof accountBalances.$inferSelect;
export type InsertAccountBalance = z.infer<typeof insertAccountBalanceSchema>;
