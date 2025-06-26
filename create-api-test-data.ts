import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

interface ApiResponse {
  id?: number;
  [key: string]: any;
}

async function apiRequest(endpoint: string, method: string = 'GET', data?: any): Promise<ApiResponse> {
  const url = `${API_BASE}${endpoint}`;
  const options: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na API ${method} ${endpoint}:`, errorText);
      throw new Error(`API Error: ${response.status}`);
    }
    
    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return { success: true };
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error(`❌ Erro ao parsear JSON:`, text);
      return { success: true };
    }
  } catch (error) {
    console.error(`❌ Falha na requisição ${method} ${endpoint}:`, error);
    throw error;
  }
}

async function createTestData() {
  console.log("🔄 Criando dados de teste via APIs...\n");
  
  try {
    // 1. Criar contas bancárias (2 contas correntes, 2 cartões, 1 poupança)
    console.log("📱 Criando contas bancárias...");
    
    // Get existing accounts first
    const existingAccounts = await apiRequest('/bank-accounts');
    let conta1, conta2;
    
    if (existingAccounts.length >= 2) {
      conta1 = existingAccounts[0];
      conta2 = existingAccounts[1];
      console.log(`✓ Usando conta existente: ${conta1.name} (ID: ${conta1.id})`);
      console.log(`✓ Usando conta existente: ${conta2.name} (ID: ${conta2.id})`);
    } else {
      conta1 = await apiRequest('/bank-accounts', 'POST', {
        name: "Conta Corrente Principal",
        type: "checking",
        balance: "15000.00",
        color: "#3B82F6",
        isActive: true
      });
      console.log(`✓ Conta Corrente Principal criada (ID: ${conta1.id || 'criada'})`);
      
      conta2 = await apiRequest('/bank-accounts', 'POST', {
        name: "Conta Corrente Secundária", 
        type: "checking",
        balance: "8500.00",
        color: "#10B981",
        isActive: true
      });
      console.log(`✓ Conta Corrente Secundária criada (ID: ${conta2.id || 'criada'})`);
    }
    
    const cartao1 = await apiRequest('/bank-accounts', 'POST', {
      name: "Cartão Visa",
      type: "credit",
      balance: "-2450.00",
      color: "#EF4444",
      lastFourDigits: "1234",
      isActive: true
    });
    console.log(`✓ Cartão Visa criado (ID: ${cartao1.id})`);
    
    const cartao2 = await apiRequest('/bank-accounts', 'POST', {
      name: "Cartão Mastercard",
      type: "credit", 
      balance: "-1850.00",
      color: "#F59E0B",
      lastFourDigits: "5678",
      isActive: true
    });
    console.log(`✓ Cartão Mastercard criado (ID: ${cartao2.id})`);
    
    const poupanca = await apiRequest('/bank-accounts', 'POST', {
      name: "Poupança",
      type: "savings",
      balance: "25000.00", 
      color: "#8B5CF6",
      isActive: true
    });
    console.log(`✓ Poupança criada (ID: ${poupanca.id})\n`);

    // 2. Obter categorias existentes
    console.log("📋 Obtendo categorias...");
    const categorias = await apiRequest('/categories');
    console.log(`✓ ${categorias.length} categorias encontradas\n`);

    // 3. Criar despesas/compras variadas
    console.log("🛒 Criando despesas e compras...");
    
    const despesas = [
      {
        description: "Supermercado Pão de Açúcar",
        amount: "320.50",
        date: new Date(2024, 11, 15).toISOString(),
        categoryId: categorias.find((c: any) => c.name === "Alimentação")?.id || 1,
        accountId: conta1.id || 1,
        isRecurring: false,
        recurringType: "none"
      },
      {
        description: "Posto de Gasolina Shell",
        amount: "180.00", 
        date: new Date(2024, 11, 20).toISOString(),
        categoryId: categorias.find((c: any) => c.name === "Transporte")?.id || 2,
        accountId: cartao1.id
      },
      {
        description: "Farmácia Droga Raia",
        amount: "95.80",
        date: new Date(2024, 11, 18).toISOString(),
        categoryId: categorias.find((c: any) => c.name === "Saúde")?.id || 3,
        accountId: conta2.id
      },
      {
        description: "Netflix - Assinatura",
        amount: "39.90",
        date: new Date(2024, 11, 10).toISOString(),
        categoryId: categorias.find((c: any) => c.name === "Entretenimento")?.id || 4,
        accountId: cartao2.id
      },
      {
        description: "Restaurante Outback",
        amount: "185.00",
        date: new Date(2024, 11, 22).toISOString(),
        categoryId: categorias.find((c: any) => c.name === "Alimentação")?.id || 1,
        accountId: cartao1.id
      },
      {
        description: "Loja de Roupas Zara",
        amount: "450.00",
        date: new Date(2024, 11, 12).toISOString(),
        categoryId: categorias.find((c: any) => c.name === "Vestuário")?.id || 5,
        accountId: cartao2.id
      }
    ];

    for (const despesa of despesas) {
      const result = await apiRequest('/expenses', 'POST', despesa);
      console.log(`✓ ${despesa.description}: R$ ${despesa.amount}`);
    }
    
    console.log("\n💳 Criando transferências para pagamento de cartão...");
    
    // 4. Transferências para pagamento de cartão de crédito
    // Março (vencimento dia 5): 60% de uma conta, 40% de outra
    const valorCartaoMarco = 2450.00;
    const valor60Porcento = valorCartaoMarco * 0.60; // R$ 1,470.00
    const valor40Porcento = valorCartaoMarco * 0.40; // R$ 980.00
    
    // Transferência 1: 60% da conta principal
    await apiRequest('/transfers', 'POST', {
      fromAccountId: conta1.id,
      toAccountId: cartao1.id,
      amount: valor60Porcento.toFixed(2),
      description: "Pagamento cartão Visa - 60%",
      date: new Date(2024, 2, 5).toISOString() // Março (mês 2)
    });
    console.log(`✓ Transferência março 60%: R$ ${valor60Porcento.toFixed(2)} (Conta Principal → Cartão Visa)`);
    
    // Transferência 2: 40% da conta secundária  
    await apiRequest('/transfers', 'POST', {
      fromAccountId: conta2.id,
      toAccountId: cartao1.id,
      amount: valor40Porcento.toFixed(2),
      description: "Pagamento cartão Visa - 40%",
      date: new Date(2024, 2, 5).toISOString() // Março (mês 2)
    });
    console.log(`✓ Transferência março 40%: R$ ${valor40Porcento.toFixed(2)} (Conta Secundária → Cartão Visa)`);
    
    // Este mês (dezembro): apenas de uma conta
    const valorCartaoDezemmbro = 1850.00;
    await apiRequest('/transfers', 'POST', {
      fromAccountId: conta1.id,
      toAccountId: cartao2.id,
      amount: valorCartaoDezemmbro.toFixed(2),
      description: "Pagamento cartão Mastercard",
      date: new Date(2024, 11, 5).toISOString() // Dezembro (mês 11)
    });
    console.log(`✓ Transferência dezembro: R$ ${valorCartaoDezemmbro.toFixed(2)} (Conta Principal → Cartão Mastercard)`);

    console.log("\n✅ Dados de teste criados com sucesso!");
    console.log("\n📊 Resumo dos dados criados:");
    console.log("- 5 contas bancárias (2 correntes, 2 cartões, 1 poupança)");
    console.log("- 6 despesas/compras variadas");
    console.log("- 3 transferências para pagamento de cartões");
    console.log("- Pagamento março: 60% + 40% de contas diferentes");
    console.log("- Pagamento dezembro: 100% de uma conta única");
    
  } catch (error) {
    console.error("\n❌ Erro ao criar dados de teste:", error);
    process.exit(1);
  }
}

// Aguardar um pouco para garantir que o servidor está pronto
setTimeout(createTestData, 2000);