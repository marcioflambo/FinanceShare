import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, insertBillSplitSchema, insertBillSplitParticipantSchema, insertCategorySchema, insertBankAccountSchema, insertRoommateSchema, insertGoalSchema, insertGoalAccountSchema, insertTransferSchema, bankAccounts } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  const DEMO_USER_ID = 1; // For demo purposes, use fixed user ID

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories(DEMO_USER_ID);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar categoria" });
      }
    }
  });

  // Bank Accounts
  app.get("/api/bank-accounts", async (req, res) => {
    try {
      const accounts = await storage.getBankAccounts(DEMO_USER_ID);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar contas bancárias" });
    }
  });

  app.post("/api/bank-accounts", async (req, res) => {
    try {
      const accountData = insertBankAccountSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const account = await storage.createBankAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error('Erro ao criar conta bancária:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar conta bancária" });
      }
    }
  });

  app.put("/api/bank-accounts/:id", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const accountData = insertBankAccountSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const account = await storage.updateBankAccount(accountId, accountData);
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar conta bancária" });
      }
    }
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      await storage.deleteBankAccount(accountId);
      res.json({ message: "Conta bancária excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir conta bancária" });
    }
  });

  app.patch("/api/bank-accounts/order", async (req, res) => {
    try {
      const { accountIds } = req.body;
      
      if (!Array.isArray(accountIds)) {
        return res.status(400).json({ message: "accountIds deve ser um array" });
      }

      // Update accounts order using storage interface
      await storage.updateBankAccountsOrder(accountIds);

      res.json({ message: "Ordem das contas atualizada com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar ordem das contas:', error);
      res.status(500).json({ message: "Erro ao atualizar ordem das contas" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses(DEMO_USER_ID);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar despesas" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      console.log('Dados recebidos para criação de despesa:', req.body);
      const expenseData = insertExpenseSchema.parse({ 
        ...req.body, 
        userId: DEMO_USER_ID,
        date: new Date(req.body.date),
        recurringType: req.body.isRecurring ? (req.body.installments ? "installment" : "advanced") : null,
        recurringFrequency: req.body.isRecurring ? req.body.recurrenceType : null,
        recurringInterval: req.body.isRecurring ? 1 : null,
        installmentTotal: req.body.isRecurring && req.body.installments ? parseInt(req.body.installments) : null,
        installmentCurrent: req.body.isRecurring && req.body.installments ? 1 : null,
        recurringEndDate: null,
        parentExpenseId: null
      });
      console.log('Dados validados:', expenseData);
      
      const expense = await storage.createExpense(expenseData);
      console.log('Despesa criada:', expense);
      
      // Update bank account balance
      // For expenses (negative impact) subtract from balance
      // For income/receipts (positive impact) add to balance
      if (!expense || !expense.accountId) {
        throw new Error('Despesa criada mas dados inválidos retornados');
      }
      
      const account = await storage.getBankAccountById(expense.accountId);
      if (account) {
        const expenseAmount = parseFloat(expense.amount);
        const currentBalance = parseFloat(account.balance);
        
        // Determine if this is income based on description or amount context
        const isIncome = expense.description.toLowerCase().includes('salário') || 
                        expense.description.toLowerCase().includes('receita') ||
                        expense.description.toLowerCase().includes('faturamento') ||
                        expense.description.toLowerCase().includes('consultoria') ||
                        expense.description.toLowerCase().includes('venda');
        
        const newBalance = isIncome ? 
          (currentBalance + expenseAmount).toFixed(2) : 
          (currentBalance - expenseAmount).toFixed(2);
          
        await storage.updateBankAccountBalance(account.id, newBalance);
      }
      
      res.json(expense);
    } catch (error: any) {
      console.error('Erro detalhado ao criar despesa:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar despesa", details: error?.message || String(error) });
      }
    }
  });

  // Update expense
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const expenseData = insertExpenseSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      
      const updatedExpense = await storage.updateExpense(expenseId, expenseData);
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Despesa não encontrada" });
      }
      
      res.json(updatedExpense);
    } catch (error: any) {
      console.error('Erro ao atualizar despesa:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar despesa", details: error?.message || String(error) });
      }
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      await storage.deleteExpense(expenseId);
      res.json({ message: "Despesa excluída com sucesso" });
    } catch (error: any) {
      console.error('Erro ao excluir despesa:', error);
      res.status(500).json({ message: "Erro ao excluir despesa", details: error?.message || String(error) });
    }
  });

  // Bill Splits
  app.get("/api/bill-splits", async (req, res) => {
    try {
      const billSplits = await storage.getBillSplits(DEMO_USER_ID);
      const billSplitsWithParticipants = await Promise.all(
        billSplits.map(async (split) => {
          const participants = await storage.getBillSplitParticipants(split.id);
          return { ...split, participants };
        })
      );
      res.json(billSplitsWithParticipants);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar divisões de conta" });
    }
  });

  app.post("/api/bill-splits", async (req, res) => {
    try {
      const { participants, ...billSplitData } = req.body;
      
      const billSplit = await storage.createBillSplit({
        ...billSplitData,
        createdBy: DEMO_USER_ID,
        totalAmount: billSplitData.totalAmount.toString()
      });

      // Create participants
      const createdParticipants = await Promise.all(
        participants.map(async (participant: any) => {
          return await storage.createBillSplitParticipant({
            billSplitId: billSplit.id,
            userId: participant.roommateId || DEMO_USER_ID,
            amount: participant.amount.toString(),
            isPaid: participant.isPaid || false
          });
        })
      );

      res.json({ ...billSplit, participants: createdParticipants });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar divisão de conta" });
      }
    }
  });

  app.patch("/api/bill-splits/:participantId/payment", async (req, res) => {
    try {
      const participantId = parseInt(req.params.participantId);
      const { isPaid } = req.body;
      
      await storage.updateParticipantPaymentStatus(participantId, isPaid);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar status de pagamento" });
    }
  });

  // Roommates
  app.get("/api/roommates", async (req, res) => {
    try {
      const roommates = await storage.getRoommates(DEMO_USER_ID);
      res.json(roommates);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar colegas de quarto" });
    }
  });

  app.post("/api/roommates", async (req, res) => {
    try {
      const roommateData = insertRoommateSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const roommate = await storage.createRoommate(roommateData);
      res.json(roommate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar colega de quarto" });
      }
    }
  });

  // Statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const expenses = await storage.getExpenses(DEMO_USER_ID);
      const bankAccounts = await storage.getBankAccounts(DEMO_USER_ID);
      const billSplits = await storage.getBillSplits(DEMO_USER_ID);
      
      // Calculate total balance from active accounts only
      const totalBalance = bankAccounts
        .filter(account => account.isActive !== false)
        .reduce((sum, account) => {
          return sum + parseFloat(account.balance);
        }, 0);
      
      // Calculate monthly expenses (current month) - only from active accounts
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const activeAccountIds = bankAccounts
        .filter(account => account.isActive !== false)
        .map(account => account.id);
      
      const monthlyExpenses = expenses
        .filter(expense => 
          new Date(expense.date) >= startOfMonth && 
          activeAccountIds.includes(expense.accountId)
        )
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      // Calculate pending bill splits (amounts owed to user)
      const pendingSplits = await Promise.all(
        billSplits.map(async (split) => {
          const participants = await storage.getBillSplitParticipants(split.id);
          return participants.filter(p => !p.isPaid);
        })
      );
      const pendingAmount = pendingSplits.flat().reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      // Calculate savings (only from savings accounts)
      const savings = bankAccounts
        .filter(account => account.type === 'savings' && account.isActive !== false)
        .reduce((sum, account) => sum + parseFloat(account.balance), 0);
      
      res.json({
        totalBalance: Math.round(totalBalance * 100) / 100,
        monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
        pendingSplits: Math.round(pendingAmount * 100) / 100,
        savings: Math.round(savings * 100) / 100
      });
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      res.status(500).json({ message: "Erro ao calcular estatísticas" });
    }
  });

  // Goals
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals(DEMO_USER_ID);
      const goalsWithAccounts = await Promise.all(
        goals.map(async (goal) => {
          const goalAccounts = await storage.getGoalAccounts(goal.id);
          const accounts = await Promise.all(
            goalAccounts.map(async (ga) => {
              const account = await storage.getBankAccountById(ga.accountId);
              return account;
            })
          );
          
          // Calculate current amount based on linked accounts
          const currentAmount = accounts
            .filter(Boolean)
            .reduce((sum, account) => sum + parseFloat(account!.balance), 0);
          
          // Update goal progress
          await storage.updateGoalProgress(goal.id, currentAmount.toString());
          
          return {
            ...goal,
            currentAmount: currentAmount.toString(),
            accounts: accounts.filter(Boolean),
            progress: Math.min((currentAmount / parseFloat(goal.targetAmount)) * 100, 100)
          };
        })
      );
      
      res.json(goalsWithAccounts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar metas" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const { accounts, ...goalData } = req.body;
      
      const goal = await storage.createGoal({
        ...goalData,
        userId: DEMO_USER_ID,
        targetDate: goalData.targetDate ? new Date(goalData.targetDate) : null
      });

      // Link accounts to goal
      if (accounts && accounts.length > 0) {
        await Promise.all(
          accounts.map(async (accountId: number) => {
            await storage.addAccountToGoal({
              goalId: goal.id,
              accountId
            });
          })
        );
      }

      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar meta" });
      }
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      await storage.deleteGoal(goalId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar meta" });
    }
  });

  // AI Tips
  app.get("/api/ai-tips", async (req, res) => {
    try {
      // Simple AI tip logic based on expense patterns
      const expenses = await storage.getExpenses(DEMO_USER_ID);
      const categories = await storage.getCategories(DEMO_USER_ID);
      
      // Calculate expenses by category
      const categoryTotals = new Map<number, number>();
      expenses.forEach(expense => {
        const current = categoryTotals.get(expense.categoryId) || 0;
        categoryTotals.set(expense.categoryId, current + parseFloat(expense.amount));
      });
      
      // Find highest spending category
      let highestCategory = "";
      let highestAmount = 0;
      Array.from(categoryTotals.entries()).forEach(([categoryId, amount]) => {
        if (amount > highestAmount) {
          highestAmount = amount;
          const category = categories.find(c => c.id === categoryId);
          highestCategory = category?.name || "Desconhecida";
        }
      });
      
      const tips = [
        `Você gastou mais em ${highestCategory} este mês. Considere criar um orçamento específico para esta categoria.`,
        "Tente usar a regra 50/30/20: 50% para necessidades, 30% para desejos e 20% para poupança.",
        "Considere preparar mais refeições em casa para economizar em alimentação.",
        "Analise suas assinaturas e cancele as que não usa regularmente.",
        "Estabeleça uma meta de economia mensal e acompanhe seu progresso."
      ];
      
      res.json({
        tip: tips[Math.floor(Math.random() * tips.length)]
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar dica" });
    }
  });

  // Transfers
  app.get("/api/transfers", async (req, res) => {
    try {
      const transfers = await storage.getTransfers(DEMO_USER_ID);
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar transferências" });
    }
  });

  app.post("/api/transfers", async (req, res) => {
    try {
      const transferData = insertTransferSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const transfer = await storage.createTransfer(transferData);
      res.json(transfer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar transferência" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
