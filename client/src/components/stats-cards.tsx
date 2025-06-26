import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { formatCurrencyDisplay } from "@/lib/currency";
import { TrendingUp, TrendingDown, Users, PiggyBank, Target, Building } from "lucide-react";
import type { BankAccount } from "@shared/schema";

interface StatisticsData {
  totalBalance: number;
  monthlyExpenses: number;
  pendingSplits: number;
  savings: number;
}

export function StatsCards() {
  const { data: stats, isLoading } = useQuery<StatisticsData>({
    queryKey: ["/api/statistics"],
  });

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  // Calculate sum of active accounts
  const activeAccountsSum = accounts
    .filter(account => account.isActive !== false)
    .reduce((sum, account) => sum + parseFloat(account.balance), 0);

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

  const activeAccountsCount = accounts.filter(acc => acc.isActive !== false).length;
  const totalAccountsCount = accounts.length;

  const cards = [
    {
      title: "Soma das Contas Ativas",
      value: activeAccountsSum,
      icon: <Building className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-50",
      change: `${activeAccountsCount} ativas`,
      changeColor: "text-blue-600 bg-blue-100",
    },
    {
      title: "Gastos do Mês",
      value: stats.monthlyExpenses,
      icon: <TrendingDown className="w-4 h-4 text-red-500" />,
      iconBg: "bg-red-50",
      change: "-8%",
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
      value: stats.savings,
      icon: <PiggyBank className="w-4 h-4 text-green-600" />,
      iconBg: "bg-green-50",
      change: "Meta 85%",
      changeColor: "text-green-600 bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
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
            {card.title === "Contas Ativas" ? card.value : formatCurrencyDisplay(card.value)}
          </p>
          <p className="text-xs md:text-sm text-gray-600">{card.title}</p>
        </Card>
      ))}
    </div>
  );
}
