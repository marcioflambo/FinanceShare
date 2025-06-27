import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { formatCurrencyDisplay } from "@/lib/currency";
import { TrendingUp, TrendingDown, Users, PiggyBank, Target, Building } from "lucide-react";
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
  const { data: stats, isLoading } = useQuery<StatisticsData>({
    queryKey: ["/api/statistics"],
  });

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Filter accounts based on selection or default to active accounts
  const filteredAccounts = selectedAccountIds.length > 0 
    ? accounts.filter(account => selectedAccountIds.includes(account.id))
    : accounts.filter(account => account.isActive !== false);

  // Calculate sum of filtered accounts
  const filteredAccountsSum = filteredAccounts
    .reduce((sum, account) => sum + parseFloat(account.balance), 0);

  // Calculate monthly expenses for filtered accounts
  const currentMonth = new Date();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  
  const monthlyExpensesForAccounts = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      const isCurrentMonth = expenseDate >= firstDayOfMonth && expenseDate <= currentMonth;
      const isFromSelectedAccount = selectedAccountIds.length > 0 
        ? selectedAccountIds.includes(expense.accountId)
        : accounts.find(acc => acc.id === expense.accountId)?.isActive !== false;
      return isCurrentMonth && isFromSelectedAccount;
    })
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

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

  const cards = [
    {
      title: "Saldo",
      value: filteredAccountsSum,
      icon: <Building className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-50",
      change: selectedAccountIds.length > 0 ? `${filteredAccountsCount} selecionadas` : `${filteredAccountsCount} ativas`,
      changeColor: "text-blue-600 bg-blue-100",
    },
    {
      title: "Gastos do Mês",
      value: monthlyExpensesForAccounts,
      icon: <TrendingDown className="w-4 h-4 text-red-500" />,
      iconBg: "bg-red-50",
      change: selectedAccountIds.length > 0 ? "Contas selecionadas" : "Contas ativas",
      changeColor: "text-red-600 bg-red-100",
    },
    {
      title: "A Receber",
      value: stats.pendingSplits,
      icon: <Users className="w-4 h-4 text-yellow-600" />,
      iconBg: "bg-yellow-50",
      change: "3 ativos",
      changeColor: "text-yellow-600 bg-yellow-100",
    },
    {
      title: "Economia",
      value: savingsSum,
      icon: <PiggyBank className="w-4 h-4 text-green-600" />,
      iconBg: "bg-green-50",
      change: selectedAccountIds.length > 0 ? "Poupanças selecionadas" : "Contas poupança",
      changeColor: "text-green-600 bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="p-3 md:p-4 shadow-sm border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-7 h-7 md:w-8 md:h-8 ${card.iconBg} rounded-lg flex items-center justify-center`}>
              {card.icon}
            </div>
            <span className={`text-xs px-1.5 md:px-2 py-1 rounded-full ${card.changeColor}`}>
              {card.change}
            </span>
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900 mb-1">
            {formatCurrencyDisplay(card.value)}
          </p>
          <p className="text-xs md:text-sm text-gray-600">{card.title}</p>
        </Card>
      ))}
    </div>
  );
}
