import { db, databaseInitialization } from "./server/db";
import { expenses, transfers, bankAccounts } from "./shared/schema";

async function createDirectMySQLData() {
  // Wait for database initialization
  await databaseInitialization;
  
  if (!db) {
    throw new Error("Database not available");
  }
  
  console.log("🚀 Criando dados diretamente no MySQL...");

  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);

  console.log("💰 Criando 12 meses de dados financeiros...");

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthOffset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    console.log(`📅 Processando ${monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}...`);

    // 1. SALÁRIO NO DIA 30 (R$ 15.000) - CONTA CORRENTE
    const salaryDate = new Date(year, month, 30);
    await db.insert(expenses).values({
      description: `Salário - ${salaryDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      amount: '15000.00',
      date: salaryDate,
      categoryId: 1, // Receita/Alimentação
      accountId: 1, // Conta Corrente Principal
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

    // 2. TRANSFERÊNCIA PARA POUPANÇA (R$ 1.500)
    await db.insert(transfers).values({
      description: `Transferência mensal para poupança - ${salaryDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      amount: '1500.00',
      date: salaryDate,
      fromAccountId: 1, // Conta Corrente
      toAccountId: 5,   // Poupança
      userId: 1
    });

    // 3. GASTOS DIVERSOS - CONTA CORRENTE
    const expensesData = [
      // Alimentação
      { desc: 'Supermercado Pão de Açúcar', amount: '450.00', cat: 1, day: 2 },
      { desc: 'Restaurante Outback', amount: '180.00', cat: 1, day: 5 },
      { desc: 'iFood - Jantar', amount: '65.90', cat: 1, day: 7 },
      { desc: 'Supermercado Extra', amount: '380.00', cat: 1, day: 12 },
      { desc: 'Restaurante Japonês', amount: '295.00', cat: 1, day: 15 },
      { desc: 'Supermercado Carrefour', amount: '420.00', cat: 1, day: 20 },
      { desc: 'Feira Orgânica', amount: '125.00', cat: 1, day: 25 },

      // Transporte  
      { desc: 'Posto Shell - Gasolina', amount: '320.00', cat: 2, day: 4 },
      { desc: 'Uber', amount: '45.50', cat: 2, day: 6 },
      { desc: 'Posto Ipiranga - Gasolina', amount: '285.00', cat: 2, day: 14 },
      { desc: 'Manutenção Carro', amount: '450.00', cat: 2, day: 19 },

      // Lazer
      { desc: 'Cinema Cinemark', amount: '85.00', cat: 3, day: 9 },
      { desc: 'Spotify Premium', amount: '19.90', cat: 3, day: 11 },
      { desc: 'Netflix', amount: '45.90', cat: 3, day: 11 },
      { desc: 'Show Musical', amount: '280.00', cat: 3, day: 13 },
      { desc: 'Bar com Amigos', amount: '165.00', cat: 3, day: 21 },

      // Saúde
      { desc: 'Plano de Saúde Unimed', amount: '485.00', cat: 4, day: 1 },
      { desc: 'Farmácia Droga Raia', amount: '78.50', cat: 4, day: 8 },
      { desc: 'Consulta Dermatologista', amount: '180.00', cat: 4, day: 15 },
      { desc: 'Academia Smart Fit', amount: '79.90', cat: 4, day: 20 },

      // Educação
      { desc: 'Curso Online Udemy', amount: '89.90', cat: 5, day: 5 },
      { desc: 'Livros Técnicos Amazon', amount: '145.00', cat: 5, day: 12 },
      { desc: 'Curso de Inglês', amount: '220.00', cat: 5, day: 18 },

      // Compras
      { desc: 'Roupas Zara', amount: '350.00', cat: 6, day: 7 },
      { desc: 'Eletrônicos Magazine Luiza', amount: '280.00', cat: 6, day: 14 },
      { desc: 'Calçados Centauro', amount: '189.90', cat: 6, day: 21 },

      // Casa
      { desc: 'Aluguel Apartamento', amount: '1800.00', cat: 7, day: 1 },
      { desc: 'Conta de Luz CPFL', amount: '185.50', cat: 7, day: 10 },
      { desc: 'Conta de Água SABESP', amount: '95.00', cat: 7, day: 15 },
      { desc: 'Internet Vivo Fibra', amount: '99.90', cat: 7, day: 5 },
      { desc: 'Gás de Cozinha', amount: '85.00', cat: 7, day: 20 },
    ];

    // Inserir gastos da conta corrente
    for (const expense of expensesData) {
      const expenseDate = new Date(year, month, expense.day);
      await db.insert(expenses).values({
        description: expense.desc,
        amount: expense.amount,
        date: expenseDate,
        categoryId: expense.cat,
        accountId: 1, // Conta Corrente Principal
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
    }

    // 4. MOVIMENTAÇÃO EMPRESARIAL - CONTA EMPRESA
    const businessData = [
      // Receitas Empresariais
      { desc: 'Faturamento Serviços - Cliente A', amount: '8500.00', cat: 1, day: 5 },
      { desc: 'Consultoria Projeto Beta', amount: '12000.00', cat: 1, day: 15 },
      { desc: 'Venda Produto Digital', amount: '3200.00', cat: 1, day: 25 },

      // Gastos Empresariais
      { desc: 'Aluguel Escritório', amount: '2500.00', cat: 7, day: 1 },
      { desc: 'Salários Funcionários', amount: '8500.00', cat: 7, day: 30 },
      { desc: 'Fornecedor Material', amount: '1850.00', cat: 6, day: 8 },
      { desc: 'Marketing Google Ads', amount: '750.00', cat: 6, day: 12 },
      { desc: 'Software Empresarial', amount: '450.00', cat: 5, day: 18 },
      { desc: 'Energia Elétrica Escritório', amount: '380.00', cat: 7, day: 22 },
      { desc: 'Internet Empresarial', amount: '199.90', cat: 7, day: 5 },
      { desc: 'Combustível Frota', amount: '890.00', cat: 2, day: 10 },
      { desc: 'Manutenção Equipamentos', amount: '650.00', cat: 7, day: 16 },
    ];

    // Inserir movimentação empresarial
    for (const business of businessData) {
      const businessDate = new Date(year, month, business.day);
      await db.insert(expenses).values({
        description: business.desc,
        amount: business.amount,
        date: businessDate,
        categoryId: business.cat,
        accountId: 2, // Conta Corrente Secundária (Empresa)
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
    }

    console.log(`✅ Mês ${month + 1}/${year} processado - ${expensesData.length + businessData.length + 1} transações`);
  }

  // 5. ATUALIZAR SALDOS DAS CONTAS
  console.log("🔄 Atualizando saldos finais das contas...");
  
  // Conta Corrente: Saldo positivo
  await db.update(bankAccounts)
    .set({ balance: '2850.00' })
    .where({ id: 1 });

  // Poupança: R$ 18.000 (12 x R$ 1.500)
  await db.update(bankAccounts)
    .set({ balance: '18000.00' })
    .where({ id: 5 });

  // Conta Empresa: Saldo empresarial positivo
  await db.update(bankAccounts)
    .set({ balance: '15750.00' })
    .where({ id: 2 });

  console.log("🎉 Massa de dados criada com sucesso!");
  console.log(`
  📊 RESUMO DOS DADOS CRIADOS:
  ════════════════════════════
  
  📅 Período: 12 meses completos
  💰 Salário mensal: R$ 15.000 
  💸 Transferências poupança: R$ 1.500/mês
  🏪 Gastos mensais variados por categoria
  🏢 Movimentação empresarial completa
  
  💳 SALDOS FINAIS:
  ─────────────────
  • Conta Corrente: R$ 2.850,00
  • Poupança: R$ 18.000,00  
  • Conta Empresa: R$ 15.750,00
  
  📈 Total estimado: ~600 transações
  🏷️ Todas as categorias utilizadas
  📊 Dados realistas para testes completos
  `);
}

createDirectMySQLData().catch(console.error);