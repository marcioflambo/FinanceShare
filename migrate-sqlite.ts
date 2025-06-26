import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './shared/schema';

// Create SQLite database
const sqlite = new Database('financeapp.db');
const db = drizzle(sqlite, { schema });

// Create tables manually since we don't have migrations for SQLite
const createTables = () => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance TEXT NOT NULL DEFAULT '0',
      last_four_digits TEXT,
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount TEXT NOT NULL,
      date TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      bank_account_id INTEGER NOT NULL,
      installments INTEGER DEFAULT 1,
      current_installment INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS bill_splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      total_amount TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bill_split_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_split_id INTEGER NOT NULL,
      roommate_id INTEGER,
      name TEXT NOT NULL,
      amount TEXT NOT NULL,
      is_paid BOOLEAN DEFAULT false,
      FOREIGN KEY (bill_split_id) REFERENCES bill_splits(id)
    );

    CREATE TABLE IF NOT EXISTS roommates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      target_amount TEXT NOT NULL,
      current_amount TEXT DEFAULT '0',
      target_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS goal_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      FOREIGN KEY (goal_id) REFERENCES goals(id),
      FOREIGN KEY (account_id) REFERENCES bank_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      from_account_id INTEGER NOT NULL,
      to_account_id INTEGER NOT NULL,
      amount TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (from_account_id) REFERENCES bank_accounts(id),
      FOREIGN KEY (to_account_id) REFERENCES bank_accounts(id)
    );
  `);
};

createTables();

// Insert demo data
const insertDemoData = () => {
  // Demo user
  const userId = sqlite.prepare('INSERT INTO users (email, name) VALUES (?, ?) RETURNING id').get('demo@financeshare.com', 'Demo User').id;

  // Categories
  const categories = [
    { name: 'Alimentação', icon: 'fas fa-utensils', color: '#FF6B6B' },
    { name: 'Transporte', icon: 'fas fa-car', color: '#4ECDC4' },
    { name: 'Saúde', icon: 'fas fa-heartbeat', color: '#45B7D1' },
    { name: 'Educação', icon: 'fas fa-graduation-cap', color: '#96CEB4' },
    { name: 'Lazer', icon: 'fas fa-gamepad', color: '#FFEAA7' },
    { name: 'Casa', icon: 'fas fa-home', color: '#DDA0DD' },
    { name: 'Roupas', icon: 'fas fa-tshirt', color: '#98D8C8' },
    { name: 'Outros', icon: 'fas fa-ellipsis-h', color: '#F7DC6F' }
  ];

  const categoryIds = categories.map(cat => 
    sqlite.prepare('INSERT INTO categories (user_id, name, icon, color) VALUES (?, ?, ?, ?) RETURNING id')
      .get(userId, cat.name, cat.icon, cat.color).id
  );

  // Bank accounts
  const bankAccounts = [
    { name: 'Banco do Brasil', type: 'checking', balance: '2450.50', isActive: true, sortOrder: 0 },
    { name: 'Nubank', type: 'credit', balance: '1200.25', isActive: true, sortOrder: 1 },
    { name: 'Poupança Caixa', type: 'savings', balance: '800.00', isActive: true, sortOrder: 2 },
    { name: 'Cartão Itaú', type: 'credit', balance: '537.00', isActive: false, sortOrder: 3 }
  ];

  const accountIds = bankAccounts.map(acc => 
    sqlite.prepare('INSERT INTO bank_accounts (user_id, name, type, balance, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
      .get(userId, acc.name, acc.type, acc.balance, acc.isActive ? 1 : 0, acc.sortOrder).id
  );

  // Expenses
  const expenses = [
    { description: 'Supermercado Extra', amount: '156.40', categoryId: categoryIds[0], accountId: accountIds[0], date: '2025-01-15' },
    { description: 'Uber para trabalho', amount: '23.50', categoryId: categoryIds[1], accountId: accountIds[1], date: '2025-01-14' },
    { description: 'Consulta médica', amount: '180.00', categoryId: categoryIds[2], accountId: accountIds[0], date: '2025-01-13' },
    { description: 'Curso online', amount: '97.90', categoryId: categoryIds[3], accountId: accountIds[1], date: '2025-01-12' },
    { description: 'Cinema com amigos', amount: '45.00', categoryId: categoryIds[4], accountId: accountIds[2], date: '2025-01-11' }
  ];

  expenses.forEach(exp => 
    sqlite.prepare('INSERT INTO expenses (user_id, description, amount, date, category_id, bank_account_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, exp.description, exp.amount, exp.date, exp.categoryId, exp.accountId)
  );

  // Roommates
  const roommateIds = [
    sqlite.prepare('INSERT INTO roommates (user_id, name, email) VALUES (?, ?, ?) RETURNING id').get(userId, 'João Silva', 'joao@email.com').id,
    sqlite.prepare('INSERT INTO roommates (user_id, name, email) VALUES (?, ?, ?) RETURNING id').get(userId, 'Maria Oliveira', 'maria@email.com').id
  ];

  // Bill splits
  const billSplitId = sqlite.prepare('INSERT INTO bill_splits (user_id, title, description, total_amount, date) VALUES (?, ?, ?, ?, ?) RETURNING id')
    .get(userId, 'Conta de Luz', 'Divisão da conta de energia elétrica', '180.00', '2025-01-10').id;

  // Bill split participants
  sqlite.prepare('INSERT INTO bill_split_participants (bill_split_id, roommate_id, name, amount, is_paid) VALUES (?, ?, ?, ?, ?)')
    .run(billSplitId, roommateIds[0], 'João Silva', '60.00', 1);
  sqlite.prepare('INSERT INTO bill_split_participants (bill_split_id, roommate_id, name, amount, is_paid) VALUES (?, ?, ?, ?, ?)')
    .run(billSplitId, roommateIds[1], 'Maria Oliveira', '60.00', 0);
  sqlite.prepare('INSERT INTO bill_split_participants (bill_split_id, name, amount, is_paid) VALUES (?, ?, ?, ?)')
    .run(billSplitId, 'Demo User', '60.00', 1);

  // Goals
  const goalId = sqlite.prepare('INSERT INTO goals (user_id, name, description, target_amount, current_amount, target_date) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .get(userId, 'Viagem para Europa', 'Economizar para viagem de férias', '5000.00', '1200.00', '2025-07-01').id;

  // Link goal to accounts
  sqlite.prepare('INSERT INTO goal_accounts (goal_id, account_id) VALUES (?, ?)').run(goalId, accountIds[0]);
  sqlite.prepare('INSERT INTO goal_accounts (goal_id, account_id) VALUES (?, ?)').run(goalId, accountIds[2]);

  console.log('Demo data inserted successfully!');
};

insertDemoData();
sqlite.close();
console.log('SQLite database created with demo data');