import { db } from "./server/db";
import { bankAccounts, expenses, transfers, categories } from "./shared/schema";

const createTestData = async () => {
  try {
    console.log("🔄 Criando dados de teste...");

    // 1. Criar 2 contas correntes, 2 cartões de crédito e 1 poupança
    const accountsData = [
      {
        name: "Conta Corrente Principal",
        type: "checking",
        balance: "2500.00",
        color: "#3B82F6",
        lastFourDigits: "1234",
        userId: 1,
        isActive: true,
        sortOrder: 1
      },
      {
        name: "Conta Corrente Secundária", 
        type: "checking",
        balance: "1800.00",
        color: "#10B981",
        lastFourDigits: "5678",
        userId: 1,
        isActive: true,
        sortOrder: 2
      },
      {
        name: "Cartão de Crédito Visa",
        type: "credit",
        balance: "-890.00",
        color: "#EF4444",
        lastFourDigits: "1234",
        userId: 1,
        isActive: true,
        sortOrder: 3
      },
      {
        name: "Cartão de Crédito Mastercard",
        type: "credit", 
        balance: "-450.00",
        color: "#F59E0B",
        lastFourDigits: "5678",
        userId: 1,
        isActive: true,
        sortOrder: 4
      },
      {
        name: "Poupança",
        type: "savings",
        balance: "5200.00", 
        color: "#8B5CF6",
        lastFourDigits: "9012",
        userId: 1,
        isActive: true,
        sortOrder: 5
      }
    ];

    // Inserir contas bancárias
    const createdAccounts = await db.insert(bankAccounts).values(accountsData).returning();
    console.log("✅ Contas bancárias criadas:", createdAccounts.length);

    // 2. Criar dados de compras (despesas)
    const expensesData = [
      {
        description: "Supermercado Pão de Açúcar",
        amount: "125.50",
        date: new Date("2025-01-15"),
        categoryId: 1, // Alimentação
        accountId: createdAccounts[0].id, // Conta Corrente Principal
        userId: 1
      },
      {
        description: "Posto de Gasolina Shell",
        amount: "180.00",
        date: new Date("2025-01-20"),
        categoryId: 2, // Transporte
        accountId: createdAccounts[1].id, // Conta Corrente Secundária
        userId: 1
      },
      {
        description: "Amazon - Livros",
        amount: "89.90",
        date: new Date("2025-01-25"),
        categoryId: 6, // Educação
        accountId: createdAccounts[2].id, // Cartão Visa
        userId: 1
      },
      {
        description: "Farmácia São Paulo",
        amount: "45.30",
        date: new Date("2025-02-01"),
        categoryId: 4, // Saúde
        accountId: createdAccounts[3].id, // Cartão Mastercard
        userId: 1
      },
      {
        description: "Netflix - Assinatura",
        amount: "29.90",
        date: new Date("2025-02-05"),
        categoryId: 5, // Entretenimento
        accountId: createdAccounts[2].id, // Cartão Visa
        userId: 1
      }
    ];

    // Inserir despesas
    const createdExpenses = await db.insert(expenses).values(expensesData).returning();
    console.log("✅ Despesas criadas:", createdExpenses.length);

    // 3. Criar transferências para pagamento de cartão de crédito
    // Transferência de março - 60% da conta principal, 40% da secundária
    const cartaoVisaBalance = Math.abs(parseFloat(createdAccounts[2].balance));
    const transferAmount1 = (cartaoVisaBalance * 0.6).toFixed(2);
    const transferAmount2 = (cartaoVisaBalance * 0.4).toFixed(2);

    const transfersData = [
      {
        fromAccountId: createdAccounts[0].id, // Conta Corrente Principal
        toAccountId: createdAccounts[2].id,   // Cartão Visa
        amount: transferAmount1,
        description: "Pagamento cartão Visa - 60%",
        date: new Date("2025-03-05"),
        userId: 1
      },
      {
        fromAccountId: createdAccounts[1].id, // Conta Corrente Secundária
        toAccountId: createdAccounts[2].id,   // Cartão Visa
        amount: transferAmount2,
        description: "Pagamento cartão Visa - 40%",
        date: new Date("2025-03-05"),
        userId: 1
      },
      // Transferência deste mês (janeiro) - apenas de uma conta
      {
        fromAccountId: createdAccounts[0].id, // Conta Corrente Principal
        toAccountId: createdAccounts[3].id,   // Cartão Mastercard
        amount: Math.abs(parseFloat(createdAccounts[3].balance)).toFixed(2),
        description: "Pagamento cartão Mastercard - integral",
        date: new Date("2025-01-05"),
        userId: 1
      }
    ];

    // Inserir transferências
    const createdTransfers = await db.insert(transfers).values(transfersData).returning();
    console.log("✅ Transferências criadas:", createdTransfers.length);

    console.log("\n🎉 Dados de teste criados com sucesso!");
    console.log("📊 Resumo:");
    console.log(`- ${createdAccounts.length} contas bancárias`);
    console.log(`- ${createdExpenses.length} despesas`);
    console.log(`- ${createdTransfers.length} transferências`);

  } catch (error) {
    console.error("❌ Erro ao criar dados de teste:", error);
  }
};

createTestData().then(() => {
  console.log("✅ Script concluído");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exit(1);
});