import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './shared/schema';

// MySQL connection configuration
const mysqlConfig = {
  host: '186.202.152.149',
  user: 'mlopes6',
  password: 'G1ovann@040917',
  database: 'mlopes6',
  port: 3306,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000
};

const createTables = async (connection: any) => {
  console.log("🔄 Creating MySQL tables...");
  
  // Create tables with raw SQL for MySQL
  const sqlCommands = [
    `CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR(255) PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP NOT NULL,
      INDEX IDX_session_expire (expire)
    )`,
    
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name TEXT NOT NULL,
      email VARCHAR(255) UNIQUE,
      password TEXT,
      auth_provider VARCHAR(50) DEFAULT 'manual',
      profile_image_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      user_id INT NOT NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS bank_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance DECIMAL(10,2) NOT NULL,
      color TEXT NOT NULL,
      last_four_digits TEXT,
      user_id INT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      sort_order INT DEFAULT 0
    )`,
    
    `CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date TIMESTAMP NOT NULL,
      category_id INT NOT NULL,
      account_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_recurring BOOLEAN DEFAULT false,
      recurring_type TEXT,
      recurring_frequency TEXT,
      recurring_interval INT DEFAULT 1,
      installment_total INT,
      installment_current INT,
      recurring_end_date TIMESTAMP,
      parent_expense_id INT
    )`,
    
    `CREATE TABLE IF NOT EXISTS bill_splits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title TEXT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS bill_split_participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_split_id INT NOT NULL,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      is_paid BOOLEAN DEFAULT false,
      paid_at TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS roommates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      user_id INT NOT NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      target_amount DECIMAL(10,2) NOT NULL,
      current_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
      target_date TIMESTAMP,
      is_completed BOOLEAN DEFAULT false,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS goal_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      goal_id INT NOT NULL,
      account_id INT NOT NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS transfers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date TIMESTAMP NOT NULL,
      from_account_id INT NOT NULL,
      to_account_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of sqlCommands) {
    await connection.execute(sql);
  }
  
  console.log("✅ Tables created successfully!");
};

const insertDemoData = async (connection: any) => {
  console.log("🔄 Inserting demo data...");
  
  // Demo user
  const [userResult] = await connection.execute(
    `INSERT INTO users (name, email) VALUES (?, ?)`,
    ['Demo User', 'demo@financeshare.com']
  );
  const userId = userResult.insertId;

  // Categories
  const categories = [
    ['Alimentação', 'fas fa-utensils', '#FF6B6B', userId],
    ['Transporte', 'fas fa-car', '#4ECDC4', userId],
    ['Saúde', 'fas fa-heartbeat', '#45B7D1', userId],
    ['Educação', 'fas fa-graduation-cap', '#96CEB4', userId],
    ['Lazer', 'fas fa-gamepad', '#FFEAA7', userId],
    ['Casa', 'fas fa-home', '#DDA0DD', userId],
    ['Roupas', 'fas fa-tshirt', '#98D8C8', userId],
    ['Outros', 'fas fa-ellipsis-h', '#F7DC6F', userId]
  ];

  const categoryIds = [];
  for (const category of categories) {
    const [result] = await connection.execute(
      `INSERT INTO categories (name, icon, color, user_id) VALUES (?, ?, ?, ?)`,
      category
    );
    categoryIds.push(result.insertId);
  }

  // Bank accounts
  const bankAccounts = [
    ['Banco do Brasil', 'checking', '2450.50', '#4ECDC4', null, userId, true, 0],
    ['Nubank', 'credit', '1200.25', '#8E44AD', null, userId, true, 1],
    ['Poupança Caixa', 'savings', '800.00', '#27AE60', null, userId, true, 2],
    ['Cartão Itaú', 'credit', '537.00', '#E74C3C', null, userId, false, 3]
  ];

  const accountIds = [];
  for (const account of bankAccounts) {
    const [result] = await connection.execute(
      `INSERT INTO bank_accounts (name, type, balance, color, last_four_digits, user_id, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      account
    );
    accountIds.push(result.insertId);
  }

  // Expenses
  const expenses = [
    ['Supermercado Extra', '156.40', '2025-01-15', categoryIds[0], accountIds[0], userId],
    ['Uber para trabalho', '23.50', '2025-01-14', categoryIds[1], accountIds[1], userId],
    ['Consulta médica', '180.00', '2025-01-13', categoryIds[2], accountIds[0], userId],
    ['Curso online', '97.90', '2025-01-12', categoryIds[3], accountIds[1], userId],
    ['Cinema com amigos', '45.00', '2025-01-11', categoryIds[4], accountIds[2], userId]
  ];

  for (const expense of expenses) {
    await connection.execute(
      `INSERT INTO expenses (description, amount, date, category_id, account_id, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
      expense
    );
  }

  // Roommates
  const roommates = [
    ['João Silva', 'joao@email.com', null, userId],
    ['Maria Oliveira', 'maria@email.com', null, userId]
  ];

  const roommateIds = [];
  for (const roommate of roommates) {
    const [result] = await connection.execute(
      `INSERT INTO roommates (name, email, phone, user_id) VALUES (?, ?, ?, ?)`,
      roommate
    );
    roommateIds.push(result.insertId);
  }

  // Bill split
  const [billSplitResult] = await connection.execute(
    `INSERT INTO bill_splits (title, description, total_amount, created_by) VALUES (?, ?, ?, ?)`,
    ['Conta de Luz', 'Divisão da conta de energia elétrica', '180.00', userId]
  );
  const billSplitId = billSplitResult.insertId;

  // Bill split participants
  const participants = [
    [billSplitId, userId, '60.00', true],
    [billSplitId, userId, '60.00', false],
    [billSplitId, userId, '60.00', true]
  ];

  for (const participant of participants) {
    await connection.execute(
      `INSERT INTO bill_split_participants (bill_split_id, user_id, amount, is_paid) VALUES (?, ?, ?, ?)`,
      participant
    );
  }

  // Goal
  const [goalResult] = await connection.execute(
    `INSERT INTO goals (name, description, target_amount, current_amount, target_date, color, icon, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Viagem para Europa', 'Economizar para viagem de férias', '5000.00', '1200.00', '2025-07-01', '#3498DB', 'fas fa-plane', userId]
  );
  const goalId = goalResult.insertId;

  // Link goal to accounts
  await connection.execute(
    `INSERT INTO goal_accounts (goal_id, account_id) VALUES (?, ?)`,
    [goalId, accountIds[0]]
  );
  await connection.execute(
    `INSERT INTO goal_accounts (goal_id, account_id) VALUES (?, ?)`,
    [goalId, accountIds[2]]
  );

  console.log("✅ Demo data inserted successfully!");
};

const runMigrations = async () => {
  console.log("🔄 Connecting to MySQL database...");
  
  let connection;
  try {
    connection = await mysql.createConnection(mysqlConfig);
    await connection.ping();
    console.log("✅ Successfully connected to MySQL database");
    
    await createTables(connection);
    await insertDemoData(connection);
    
    console.log("🎉 Database setup completed!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

runMigrations();