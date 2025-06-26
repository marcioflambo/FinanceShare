import { db, databaseInitialization } from "./server/db";
import { expenses, transfers, bankAccounts } from "./shared/schema";

async function createBatchData() {
  await databaseInitialization;
  
  if (!db) {
    throw new Error("Database not available");
  }
  
  console.log("🚀 Criando dados em lotes...");

  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);

  const allExpenses = [];
  const allTransfers = [];

  console.log("💰 Preparando 12 meses de dados...");

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthOffset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    // Salário mensal
    const salaryDate = new Date(year, month, 30);
    allExpenses.push({
      description: `Salário - ${salaryDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      amount: '15000.00',
      date: salaryDate,
      categoryId: 1,
      accountId: 1,
      userId: 1,
      isRecurring: false,
      recurringType: null,
      recurringFrequency: null,
      recurringInterval: null,
      installmentTotal: null,
      installmentCurrent: null,
      recurringEndDate: null,
      parentExpenseId: null
    });

    // Transferência para poupança
    allTransfers.push({
      description: `Transferência mensal - ${salaryDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      amount: '1500.00',
      date: salaryDate,
      fromAccountId: 1,
      toAccountId: 5,
      userId: 1
    });

    // Gastos diversos - Conta Corrente
    const monthlyExpenses = [
      { desc: 'Supermercado', amount: '450.00', cat: 1, day: 2 },
      { desc: 'Restaurante', amount: '180.00', cat: 1, day: 5 },
      { desc: 'Delivery', amount: '65.90', cat: 1, day: 7 },
      { desc: 'Mercado', amount: '380.00', cat: 1, day: 12 },
      { desc: 'Almoço', amount: '95.00', cat: 1, day: 15 },
      { desc: 'Gasolina', amount: '320.00', cat: 2, day: 4 },
      { desc: 'Uber', amount: '45.50', cat: 2, day: 6 },
      { desc: 'Combustível', amount: '285.00', cat: 2, day: 14 },
      { desc: 'Cinema', amount: '85.00', cat: 3, day: 9 },
      { desc: 'Streaming', amount: '45.90', cat: 3, day: 11 },
      { desc: 'Plano de Saúde', amount: '485.00', cat: 4, day: 1 },
      { desc: 'Farmácia', amount: '78.50', cat: 4, day: 8 },
      { desc: 'Curso Online', amount: '89.90', cat: 5, day: 5 },
      { desc: 'Livros', amount: '145.00', cat: 5, day: 12 },
      { desc: 'Roupas', amount: '350.00', cat: 6, day: 7 },
      { desc: 'Eletrônicos', amount: '280.00', cat: 6, day: 14 },
      { desc: 'Aluguel', amount: '1800.00', cat: 7, day: 1 },
      { desc: 'Luz', amount: '185.50', cat: 7, day: 10 },
      { desc: 'Água', amount: '95.00', cat: 7, day: 15 },
      { desc: 'Internet', amount: '99.90', cat: 7, day: 5 }
    ];

    monthlyExpenses.forEach(expense => {
      const expenseDate = new Date(year, month, expense.day);
      allExpenses.push({
        description: expense.desc,
        amount: expense.amount,
        date: expenseDate,
        categoryId: expense.cat,
        accountId: 1,
        userId: 1,
        isRecurring: false,
        recurringType: null,
        recurringFrequency: null,
        recurringInterval: null,
        installmentTotal: null,
        installmentCurrent: null,
        recurringEndDate: null,
        parentExpenseId: null
      });
    });

    // Movimentação empresarial - Conta Empresa
    const businessData = [
      { desc: 'Faturamento Serviços', amount: '8500.00', cat: 1, day: 5 },
      { desc: 'Consultoria', amount: '12000.00', cat: 1, day: 15 },
      { desc: 'Aluguel Escritório', amount: '2500.00', cat: 7, day: 1 },
      { desc: 'Salários', amount: '8500.00', cat: 7, day: 30 },
      { desc: 'Fornecedor', amount: '1850.00', cat: 6, day: 8 },
      { desc: 'Marketing', amount: '750.00', cat: 6, day: 12 },
      { desc: 'Software', amount: '450.00', cat: 5, day: 18 },
      { desc: 'Energia Escritório', amount: '380.00', cat: 7, day: 22 }
    ];

    businessData.forEach(business => {
      const businessDate = new Date(year, month, business.day);
      allExpenses.push({
        description: business.desc,
        amount: business.amount,
        date: businessDate,
        categoryId: business.cat,
        accountId: 2,
        userId: 1,
        isRecurring: false,
        recurringType: null,
        recurringFrequency: null,
        recurringInterval: null,
        installmentTotal: null,
        installmentCurrent: null,
        recurringEndDate: null,
        parentExpenseId: null
      });
    });
  }

  console.log(`📊 Inserindo ${allExpenses.length} despesas em lotes...`);
  
  // Insert expenses in batches of 50
  const batchSize = 50;
  for (let i = 0; i < allExpenses.length; i += batchSize) {
    const batch = allExpenses.slice(i, i + batchSize);
    await db.insert(expenses).values(batch);
    console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(allExpenses.length/batchSize)} inserido`);
  }

  console.log(`💸 Inserindo ${allTransfers.length} transferências...`);
  await db.insert(transfers).values(allTransfers);

  console.log("🔄 Atualizando saldos das contas...");
  
  // Update account balances
  await db.update(bankAccounts).set({ balance: '2850.00' }).where({ id: 1 });
  await db.update(bankAccounts).set({ balance: '18000.00' }).where({ id: 5 });
  await db.update(bankAccounts).set({ balance: '15750.00' }).where({ id: 2 });

  console.log("🎉 Massa de dados criada com sucesso!");
  console.log(`
  📊 DADOS CRIADOS:
  ─────────────────
  📅 Período: 12 meses
  💰 Despesas: ${allExpenses.length}
  💸 Transferências: ${allTransfers.length}
  
  💳 SALDOS FINAIS:
  • Conta Corrente: R$ 2.850,00
  • Poupança: R$ 18.000,00  
  • Conta Empresa: R$ 15.750,00
  `);
}

createBatchData().catch(console.error);