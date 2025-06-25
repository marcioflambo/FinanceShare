import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email").unique(),
  password: text("password"), // For manual registration
  authProvider: varchar("auth_provider").default("manual"), // 'google', 'manual'
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  userId: integer("user_id").notNull(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'checking', 'savings', 'credit'
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  color: text("color").notNull(),
  lastFourDigits: text("last_four_digits"),
  userId: integer("user_id").notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  categoryId: integer("category_id").notNull(),
  accountId: integer("account_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const billSplits = pgTable("bill_splits", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const billSplitParticipants = pgTable("bill_split_participants", {
  id: serial("id").primaryKey(),
  billSplitId: integer("bill_split_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
});

export const roommates = pgTable("roommates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  userId: integer("user_id").notNull(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  targetDate: timestamp("target_date"),
  isCompleted: boolean("is_completed").default(false),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalAccounts = pgTable("goal_accounts", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  accountId: integer("account_id").notNull(),
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
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  description: true,
  amount: true,
  date: true,
  categoryId: true,
  accountId: true,
  userId: true,
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
