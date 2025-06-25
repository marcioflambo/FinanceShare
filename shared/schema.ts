import { pgTable, text, integer, boolean, timestamp, uuid, decimal, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
});

// Bank accounts table
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(), // checking, savings, credit
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull().default('0'),
  userId: uuid('user_id').references(() => users.id).notNull(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  accountId: uuid('account_id').references(() => bankAccounts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
});

// Roommates table
export const roommates = pgTable('roommates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email'),
  userId: uuid('user_id').references(() => users.id).notNull(),
});

// Bill splits table
export const billSplits = pgTable('bill_splits', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  participants: json('participants').$type<{
    id: string;
    name: string;
    amount: number;
    paid: boolean;
    paidAt?: string;
  }[]>().default([]).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
});

// Goals table
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  targetAmount: decimal('target_amount', { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  targetDate: timestamp('target_date'),
  description: text('description'),
  userId: uuid('user_id').references(() => users.id).notNull(),
});

// Goal accounts junction table
export const goalAccounts = pgTable('goal_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').references(() => goals.id).notNull(),
  accountId: uuid('account_id').references(() => bankAccounts.id).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export const insertRoommateSchema = createInsertSchema(roommates).omit({ id: true });
export const insertBillSplitSchema = createInsertSchema(billSplits).omit({ id: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true });
export const insertGoalAccountSchema = createInsertSchema(goalAccounts).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type NewCategory = z.infer<typeof insertCategorySchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = z.infer<typeof insertBankAccountSchema>;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = z.infer<typeof insertExpenseSchema>;
export type Roommate = typeof roommates.$inferSelect;
export type NewRoommate = z.infer<typeof insertRoommateSchema>;
export type BillSplit = typeof billSplits.$inferSelect;
export type NewBillSplit = z.infer<typeof insertBillSplitSchema>;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = z.infer<typeof insertGoalSchema>;
export type GoalAccount = typeof goalAccounts.$inferSelect;
export type NewGoalAccount = z.infer<typeof insertGoalAccountSchema>;