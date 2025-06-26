import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from "ws";
import * as schema from './shared/schema';

neonConfig.webSocketConstructor = ws;

const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    console.log("❌ DATABASE_URL not found. Please configure it first.");
    process.exit(1);
  }

  console.log("🔄 Running database migrations...");
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log("✅ Migrations completed successfully!");
    
    // Insert demo data
    console.log("🔄 Inserting demo data...");
    
    // Demo user
    const [user] = await db.insert(schema.users).values({
      email: 'demo@financeshare.com',
      name: 'Demo User'
    }).returning();

    // Categories
    const categories = [
      { name: 'Alimentação', icon: 'fas fa-utensils', color: '#FF6B6B', userId: user.id },
      { name: 'Transporte', icon: 'fas fa-car', color: '#4ECDC4', userId: user.id },
      { name: 'Saúde', icon: 'fas fa-heartbeat', color: '#45B7D1', userId: user.id },
      { name: 'Educação', icon: 'fas fa-graduation-cap', color: '#96CEB4', userId: user.id },
      { name: 'Lazer', icon: 'fas fa-gamepad', color: '#FFEAA7', userId: user.id },
      { name: 'Casa', icon: 'fas fa-home', color: '#DDA0DD', userId: user.id },
      { name: 'Roupas', icon: 'fas fa-tshirt', color: '#98D8C8', userId: user.id },
      { name: 'Outros', icon: 'fas fa-ellipsis-h', color: '#F7DC6F', userId: user.id }
    ];

    const insertedCategories = await db.insert(schema.categories).values(categories).returning();

    // Bank accounts
    const bankAccounts = [
      { name: 'Banco do Brasil', type: 'checking' as const, balance: '2450.50', userId: user.id, isActive: true, sortOrder: 0 },
      { name: 'Nubank', type: 'credit' as const, balance: '1200.25', userId: user.id, isActive: true, sortOrder: 1 },
      { name: 'Poupança Caixa', type: 'savings' as const, balance: '800.00', userId: user.id, isActive: true, sortOrder: 2 },
      { name: 'Cartão Itaú', type: 'credit' as const, balance: '537.00', userId: user.id, isActive: false, sortOrder: 3 }
    ];

    const insertedAccounts = await db.insert(schema.bankAccounts).values(bankAccounts).returning();

    // Expenses
    const expenses = [
      { 
        description: 'Supermercado Extra', 
        amount: '156.40', 
        date: new Date('2025-01-15'), 
        userId: user.id,
        categoryId: insertedCategories[0].id, 
        bankAccountId: insertedAccounts[0].id 
      },
      { 
        description: 'Uber para trabalho', 
        amount: '23.50', 
        date: new Date('2025-01-14'), 
        userId: user.id,
        categoryId: insertedCategories[1].id, 
        bankAccountId: insertedAccounts[1].id 
      },
      { 
        description: 'Consulta médica', 
        amount: '180.00', 
        date: new Date('2025-01-13'), 
        userId: user.id,
        categoryId: insertedCategories[2].id, 
        bankAccountId: insertedAccounts[0].id 
      },
      { 
        description: 'Curso online', 
        amount: '97.90', 
        date: new Date('2025-01-12'), 
        userId: user.id,
        categoryId: insertedCategories[3].id, 
        bankAccountId: insertedAccounts[1].id 
      },
      { 
        description: 'Cinema com amigos', 
        amount: '45.00', 
        date: new Date('2025-01-11'), 
        userId: user.id,
        categoryId: insertedCategories[4].id, 
        bankAccountId: insertedAccounts[2].id 
      }
    ];

    await db.insert(schema.expenses).values(expenses);

    // Roommates
    const roommates = [
      { name: 'João Silva', email: 'joao@email.com', userId: user.id },
      { name: 'Maria Oliveira', email: 'maria@email.com', userId: user.id }
    ];

    const insertedRoommates = await db.insert(schema.roommates).values(roommates).returning();

    // Bill splits
    const [billSplit] = await db.insert(schema.billSplits).values({
      title: 'Conta de Luz',
      description: 'Divisão da conta de energia elétrica',
      totalAmount: '180.00',
      date: new Date('2025-01-10'),
      userId: user.id
    }).returning();

    // Bill split participants
    const participants = [
      { billSplitId: billSplit.id, roommateId: insertedRoommates[0].id, name: 'João Silva', amount: '60.00', isPaid: true },
      { billSplitId: billSplit.id, roommateId: insertedRoommates[1].id, name: 'Maria Oliveira', amount: '60.00', isPaid: false },
      { billSplitId: billSplit.id, name: 'Demo User', amount: '60.00', isPaid: true }
    ];

    await db.insert(schema.billSplitParticipants).values(participants);

    // Goals
    const [goal] = await db.insert(schema.goals).values({
      name: 'Viagem para Europa',
      description: 'Economizar para viagem de férias',
      targetAmount: '5000.00',
      currentAmount: '1200.00',
      targetDate: new Date('2025-07-01'),
      userId: user.id
    }).returning();

    // Link goal to accounts
    await db.insert(schema.goalAccounts).values([
      { goalId: goal.id, accountId: insertedAccounts[0].id },
      { goalId: goal.id, accountId: insertedAccounts[2].id }
    ]);

    console.log("✅ Demo data inserted successfully!");
    console.log("🎉 Database setup completed!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrations();