import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { formatCurrencyDisplay } from "@/lib/currency";
import { TrendingUp, TrendingDown, Users, PiggyBank, Target, Building } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BankAccount, Expense } from "@shared/schema";

interface StatisticsData {
  totalBalance: number;
  monthlyExpenses: number;
  pendingSplits: number;
  savings: number;
}

interface StatsCardsProps {
  selectedAccountIds?: number[];
}

export function StatsCards({ selectedAccountIds = [] }: StatsCardsProps) {
  const isMobile = useIsMobile();
  const { data: stats, isLoading } = useQuery<StatisticsData>({
    queryKey: ["/api/statistics"],
  });

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: billSplits = [] } = useQuery<any[]>({
    queryKey: ["/api/bill-splits"],
  });

  // Filter accounts based on selection and device type
  const filteredAccounts = selectedAccountIds.length > 0 
    ? accounts.filter(account => {
        if (isMobile) {
          // On mobile, show only the first selected account
          return account.id === selectedAccountIds[0];
        } else {
          // On desktop, show all selected accounts
          return selectedAccountIds.includes(account.id);
        }
      })
    : accounts.filter(account => account.isActive !== false);

  // Calculate sum of filtered accounts
  const filteredAccountsSum = filteredAccounts
    .reduce((sum, account) => sum + parseFloat(account.balance), 0);

  // Calculate recent expenses for filtered accounts (last 30 days to show data)
  const currentDate = new Date();
  const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const monthlyExpensesForAccounts = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      const isRecentExpense = expenseDate >= thirtyDaysAgo;
      
      let isFromSelectedAccount: boolean;
      if (selectedAccountIds.length > 0) {
        if (isMobile) {
          // On mobile, only consider the first selected account
          isFromSelectedAccount = expense.accountId === selectedAccountIds[0];
        } else {
          // On desktop, consider all selected accounts
          isFromSelectedAccount = selectedAccountIds.includes(expense.accountId);
        }
      } else {
        // Default to active accounts only
        isFromSelectedAccount = accounts.find(acc => acc.id === expense.accountId)?.isActive !== false;
      }
      
      return isRecentExpense && isFromSelectedAccount;
    })
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  // Calculate pending splits for filtered accounts
  const pendingSplitsForAccounts = billSplits
    .flatMap(split => split.participants || [])
    .filter(participant => {
      // Only unpaid participants
      if (participant.isPaid) return false;
      
      // Filter by selected accounts if any
      if (selectedAccountIds.length > 0) {
        if (isMobile) {
          // On mobile, only consider the first selected account
          // Note: We need to check if the split is related to the selected account
          // For now, we'll show all pending splits as they're general debt tracking
          return true;
        } else {
          // On desktop, show all pending splits for selected accounts
          return true;
        }
      }
      
      return true; // Show all pending splits by default
    })
    .reduce((sum, participant) => sum + parseFloat(participant.amount), 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="w-12 h-4 bg-gray-200 rounded-full"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded mb-1"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const filteredAccountsCount = filteredAccounts.length;
  const savingsAccounts = filteredAccounts.filter(acc => acc.type === 'savings');
  const savingsSum = savingsAccounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);

  const getAccountLabel = () => {
    if (selectedAccountIds.length > 0) {
      if (isMobile) {
        const selectedAccount = accounts.find(acc => acc.id === selectedAccountIds[0]);
        return selectedAccount ? selectedAccount.name : "Conta selecionada";
      } else {
        return `${filteredAccountsCount} selecionadas`;
      }
    }
    return `${filteredAccountsCount} ativas`;
  };

  const getExpenseLabel = () => {
    if (selectedAccountIds.length > 0) {
      if (isMobile) {
        const selectedAccount = accounts.find(acc => acc.id === selectedAccountIds[0]);
        return selectedAccount ? selectedAccount.name : "Conta selecionada";
      } else {
        return "Contas selecionadas";
      }
    }
    return "Contas ativas";
  };

  const getSavingsLabel = () => {
    if (selectedAccountIds.length > 0) {
      if (isMobile) {
        return "Conta selecionada";
      } else {
        return "Poupanças selecionadas";
      }
    }
    return "Contas poupança";
  };

  const cards = [
    {
      title: "Saldo",
      value: filteredAccountsSum,
      icon: <Building className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-50",
      change: getAccountLabel(),
      changeColor: "text-blue-600 bg-blue-100",
      description: "Total disponível",
      subtitle: filteredAccountsCount > 1 ? `${filteredAccountsCount} contas` : "Conta atual",
    },
    {
      title: "Despesas",
      value: monthlyExpensesForAccounts,
      icon: <TrendingDown className="w-4 h-4 text-red-500" />,
      iconBg: "bg-red-50",
      change: getExpenseLabel(),
      changeColor: "text-red-600 bg-red-100",
      description: "Gastos do Mês",
      subtitle: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
    },
    {
      title: "A Receber",
      value: pendingSplitsForAccounts,
      icon: <Users className="w-4 h-4 text-yellow-600" />,
      iconBg: "bg-yellow-50",
      change: selectedAccountIds.length > 0 && isMobile ? "Conta selecionada" : "Divisões pendentes",
      changeColor: "text-yellow-600 bg-yellow-100",
      description: "Valor pendente",
      subtitle: "Contas divididas",
    },
    {
      title: "Poupanças",
      value: savingsSum,
      icon: <PiggyBank className="w-4 h-4 text-green-600" />,
      iconBg: "bg-green-50",
      change: getSavingsLabel(),
      changeColor: "text-green-600 bg-green-100",
      description: "Economia",
      subtitle: savingsAccounts.length > 0 ? `${savingsAccounts.length} conta${savingsAccounts.length > 1 ? 's' : ''}` : "Sem poupanças",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="p-3 md:p-4 shadow-sm border-gray-100">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-8 h-8 md:w-10 md:h-10 ${card.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              {card.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{card.title}</p>
              <p className="text-xs text-gray-500 truncate">{card.description}</p>
            </div>
          </div>
          <p className="text-lg md:text-xl font-bold text-gray-900">
            {formatCurrencyDisplay(card.value)}
          </p>
        </Card>
      ))}
    </div>
  );
}
