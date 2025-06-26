import { db } from "./server/db";
import { expenses, transfers } from "./shared/schema";

interface ApiResponse {
  id?: number;
  [key: string]: any;
}

async function apiRequest(endpoint: string, method: string = 'GET', data?: any): Promise<ApiResponse> {
  const url = `http://localhost:5000${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

async function createComprehensiveTestData() {
  console.log("🚀 Criando massa de dados abrangente...");

  // Get existing accounts and categories
  const accounts = await apiRequest('/api/bank-accounts') as any[];
  const categories = await apiRequest('/api/categories') as any[];
  
  const contaCorrente = accounts.find(acc => acc.name.includes('Conta Corrente Principal'));
  const poupanca = accounts.find(acc => acc.name.includes('Poupança'));
  const contaEmpresa = accounts.find(acc => acc.name.includes('Conta Corrente Secundária'));
  
  if (!contaCorrente || !poupanca || !contaEmpresa) {
    console.error("❌ Contas necessárias não encontradas");
    return;
  }

  console.log(`📊 Usando contas: 
    - Conta Corrente: ${contaCorrente.name} (ID: ${contaCorrente.id})
    - Poupança: ${poupanca.name} (ID: ${poupanca.id})
    - Conta Empresa: ${contaEmpresa.name} (ID: ${contaEmpresa.id})`);

  // Categories mapping
  const categoriaMap = {
    alimentacao: categories.find(c => c.name === 'Alimentação')?.id || 1,
    transporte: categories.find(c => c.name === 'Transporte')?.id || 2,
    lazer: categories.find(c => c.name === 'Lazer')?.id || 3,
    saude: categories.find(c => c.name === 'Saúde')?.id || 4,
    educacao: categories.find(c => c.name === 'Educação')?.id || 5,
    compras: categories.find(c => c.name === 'Compras')?.id || 6,
    casa: categories.find(c => c.name === 'Casa')?.id || 7,
    receita: categories.find(c => c.name === 'Receita')?.id || 1,
  };

  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);

  console.log("💰 Criando dados de 12 meses...");

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthOffset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    console.log(`📅 Processando ${monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}...`);

    // 1. SALÁRIO NO DIA 30 (R$ 15.000)
    const salaryDate = new Date(year, month, 30);
    await apiRequest('/api/expenses', 'POST', {
      description: `Salário - ${salaryDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      amount: '15000.00',
      date: salaryDate.toISOString().split('T')[0],
      categoryId: categoriaMap.receita,
      accountId: contaCorrente.id,
      isRecurring: false
    });

    // 2. TRANSFERÊNCIA PARA POUPANÇA (R$ 1.500) - DIA 30
    await apiRequest('/api/transfers', 'POST', {
      description: `Transferência mensal para poupança - ${salaryDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      amount: '1500.00',
      date: salaryDate.toISOString().split('T')[0],
      fromAccountId: contaCorrente.id,
      toAccountId: poupanca.id
    });

    // 3. GASTOS DISTRIBUÍDOS AO LONGO DO MÊS - CONTA CORRENTE
    const expensesData = [
      // Alimentação (R$ 3.000-4.000/mês)
      { desc: 'Supermercado Pão de Açúcar', amount: '450.00', cat: categoriaMap.alimentacao, day: 2 },
      { desc: 'Padaria Central', amount: '85.50', cat: categoriaMap.alimentacao, day: 3 },
      { desc: 'Restaurante Outback', amount: '180.00', cat: categoriaMap.alimentacao, day: 5 },
      { desc: 'iFood - Jantar', amount: '65.90', cat: categoriaMap.alimentacao, day: 7 },
      { desc: 'Açougue Premium', amount: '220.00', cat: categoriaMap.alimentacao, day: 10 },
      { desc: 'Supermercado Extra', amount: '380.00', cat: categoriaMap.alimentacao, day: 12 },
      { desc: 'Restaurante Japonês', amount: '295.00', cat: categoriaMap.alimentacao, day: 15 },
      { desc: 'Padaria do Bairro', amount: '45.80', cat: categoriaMap.alimentacao, day: 18 },
      { desc: 'Supermercado Carrefour', amount: '420.00', cat: categoriaMap.alimentacao, day: 20 },
      { desc: 'Pizzaria Famiglia', amount: '89.90', cat: categoriaMap.alimentacao, day: 22 },
      { desc: 'Feira Orgânica', amount: '125.00', cat: categoriaMap.alimentacao, day: 25 },
      { desc: 'Restaurante Vegetariano', amount: '78.00', cat: categoriaMap.alimentacao, day: 28 },

      // Transporte (R$ 800-1.200/mês)
      { desc: 'Posto Shell - Gasolina', amount: '320.00', cat: categoriaMap.transporte, day: 4 },
      { desc: 'Uber', amount: '45.50', cat: categoriaMap.transporte, day: 6 },
      { desc: 'Estacionamento Shopping', amount: '15.00', cat: categoriaMap.transporte, day: 8 },
      { desc: 'Posto Ipiranga - Gasolina', amount: '285.00', cat: categoriaMap.transporte, day: 14 },
      { desc: '99Taxi', amount: '32.80', cat: categoriaMap.transporte, day: 16 },
      { desc: 'Manutenção Carro', amount: '450.00', cat: categoriaMap.transporte, day: 19 },
      { desc: 'Uber Eats', amount: '28.90', cat: categoriaMap.transporte, day: 23 },

      // Lazer (R$ 1.000-1.500/mês)
      { desc: 'Cinema Cinemark', amount: '85.00', cat: categoriaMap.lazer, day: 9 },
      { desc: 'Spotify Premium', amount: '19.90', cat: categoriaMap.lazer, day: 11 },
      { desc: 'Netflix', amount: '45.90', cat: categoriaMap.lazer, day: 11 },
      { desc: 'Show Musical', amount: '280.00', cat: categoriaMap.lazer, day: 13 },
      { desc: 'Livraria Saraiva', amount: '125.50', cat: categoriaMap.lazer, day: 17 },
      { desc: 'Bar com Amigos', amount: '165.00', cat: categoriaMap.lazer, day: 21 },
      { desc: 'Parque Aquático', amount: '95.00', cat: categoriaMap.lazer, day: 26 },

      // Saúde (R$ 600-1.000/mês)
      { desc: 'Plano de Saúde Unimed', amount: '485.00', cat: categoriaMap.saude, day: 1 },
      { desc: 'Farmácia Droga Raia', amount: '78.50', cat: categoriaMap.saude, day: 8 },
      { desc: 'Consulta Dermatologista', amount: '180.00', cat: categoriaMap.saude, day: 15 },
      { desc: 'Academia Smart Fit', amount: '79.90', cat: categoriaMap.saude, day: 20 },

      // Educação (R$ 300-600/mês)
      { desc: 'Curso Online Udemy', amount: '89.90', cat: categoriaMap.educacao, day: 5 },
      { desc: 'Livros Técnicos Amazon', amount: '145.00', cat: categoriaMap.educacao, day: 12 },
      { desc: 'Curso de Inglês', amount: '220.00', cat: categoriaMap.educacao, day: 18 },

      // Compras (R$ 800-1.500/mês)
      { desc: 'Roupas Zara', amount: '350.00', cat: categoriaMap.compras, day: 7 },
      { desc: 'Eletrônicos Magazine Luiza', amount: '280.00', cat: categoriaMap.compras, day: 14 },
      { desc: 'Calçados Centauro', amount: '189.90', cat: categoriaMap.compras, day: 21 },
      { desc: 'Perfume O Boticário', amount: '125.00', cat: categoriaMap.compras, day: 27 },

      // Casa (R$ 1.000-2.000/mês)
      { desc: 'Aluguel Apartamento', amount: '1800.00', cat: categoriaMap.casa, day: 1 },
      { desc: 'Conta de Luz CPFL', amount: '185.50', cat: categoriaMap.casa, day: 10 },
      { desc: 'Conta de Água SABESP', amount: '95.00', cat: categoriaMap.casa, day: 15 },
      { desc: 'Internet Vivo Fibra', amount: '99.90', cat: categoriaMap.casa, day: 5 },
      { desc: 'Gás de Cozinha', amount: '85.00', cat: categoriaMap.casa, day: 20 },
      { desc: 'Limpeza Doméstica', amount: '150.00', cat: categoriaMap.casa, day: 25 },
    ];

    // Criar gastos da conta corrente
    for (const expense of expensesData) {
      const expenseDate = new Date(year, month, expense.day);
      await apiRequest('/api/expenses', 'POST', {
        description: expense.desc,
        amount: expense.amount,
        date: expenseDate.toISOString().split('T')[0],
        categoryId: expense.cat,
        accountId: contaCorrente.id,
        isRecurring: false
      });
    }

    // 4. MOVIMENTAÇÃO EMPRESARIAL - CONTA EMPRESA
    const businessData = [
      // Receitas Empresariais
      { desc: 'Faturamento Serviços - Cliente A', amount: '8500.00', cat: categoriaMap.receita, day: 5 },
      { desc: 'Consultoria Projeto Beta', amount: '12000.00', cat: categoriaMap.receita, day: 15 },
      { desc: 'Venda Produto Digital', amount: '3200.00', cat: categoriaMap.receita, day: 25 },

      // Gastos Empresariais
      { desc: 'Aluguel Escritório', amount: '2500.00', cat: categoriaMap.casa, day: 1 },
      { desc: 'Salários Funcionários', amount: '8500.00', cat: categoriaMap.casa, day: 30 },
      { desc: 'Fornecedor Material', amount: '1850.00', cat: categoriaMap.compras, day: 8 },
      { desc: 'Marketing Google Ads', amount: '750.00', cat: categoriaMap.compras, day: 12 },
      { desc: 'Software Empresarial', amount: '450.00', cat: categoriaMap.educacao, day: 18 },
      { desc: 'Energia Elétrica Escritório', amount: '380.00', cat: categoriaMap.casa, day: 22 },
      { desc: 'Internet Empresarial', amount: '199.90', cat: categoriaMap.casa, day: 5 },
      { desc: 'Combustível Frota', amount: '890.00', cat: categoriaMap.transporte, day: 10 },
      { desc: 'Manutenção Equipamentos', amount: '650.00', cat: categoriaMap.casa, day: 16 },
      { desc: 'Almoço Clientes', amount: '320.00', cat: categoriaMap.alimentacao, day: 20 },
    ];

    // Criar movimentação empresarial
    for (const business of businessData) {
      const businessDate = new Date(year, month, business.day);
      await apiRequest('/api/expenses', 'POST', {
        description: business.desc,
        amount: business.amount,
        date: businessDate.toISOString().split('T')[0],
        categoryId: business.cat,
        accountId: contaEmpresa.id,
        isRecurring: false
      });
    }

    console.log(`✅ Mês ${month + 1}/${year} processado com sucesso`);
  }

  // 5. ATUALIZAR SALDOS DAS CONTAS
  console.log("🔄 Atualizando saldos das contas...");
  
  // Conta Corrente: Saldo positivo após 12 meses
  await apiRequest(`/api/bank-accounts/${contaCorrente.id}`, 'PUT', {
    name: contaCorrente.name,
    type: contaCorrente.type,
    balance: '2850.00', // Saldo final positivo
    isActive: true
  });

  // Poupança: R$ 18.000 (12 x R$ 1.500)
  await apiRequest(`/api/bank-accounts/${poupanca.id}`, 'PUT', {
    name: poupanca.name,
    type: poupanca.type,
    balance: '18000.00',
    isActive: true
  });

  // Conta Empresa: Saldo empresarial positivo
  await apiRequest(`/api/bank-accounts/${contaEmpresa.id}`, 'PUT', {
    name: contaEmpresa.name,
    type: contaEmpresa.type,
    balance: '15750.00',
    isActive: true
  });

  console.log("🎉 Massa de dados abrangente criada com sucesso!");
  console.log(`
  📊 RESUMO DOS DADOS CRIADOS:
  ════════════════════════════
  
  📅 Período: 12 meses completos
  💰 Salário mensal: R$ 15.000 (dia 30)
  💸 Transferências poupança: R$ 1.500/mês
  🏪 Gastos mensais: ~R$ 12.000-13.000
  🏢 Movimentação empresarial: Receitas e despesas
  
  💳 SALDOS FINAIS:
  ─────────────────
  • Conta Corrente: R$ 2.850,00
  • Poupança: R$ 18.000,00  
  • Conta Empresa: R$ 15.750,00
  
  📈 Total de transações: ~600 registros
  🏷️ Categorias utilizadas: Todas
  📊 Dados realistas para análise completa
  `);
}

createComprehensiveTestData().catch(console.error);