import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useMemo, useState } from "react";
import { format, isThisYear, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Search, Calendar } from "lucide-react";
import type { Expense, Category, BankAccount } from "@shared/schema";

interface AllTransactionsProps {
  onBack: () => void;
}

export function AllTransactions({ onBack }: AllTransactionsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("all");

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const { transactionsByMonth, availableMonths, filteredTransactions } = useMemo(() => {
    // Get active account IDs
    const activeAccountIds = accounts
      .filter(account => account.isActive !== false)
      .map(account => account.id);

    // Filter and enhance transactions
    const enhancedTransactions = expenses
      .filter(expense => activeAccountIds.includes(expense.accountId))
      .map(expense => {
        const category = categories.find(c => c.id === expense.categoryId);
        const account = accounts.find(a => a.id === expense.accountId);
        return {
          ...expense,
          category,
          account,
          date: new Date(expense.date)
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    // Get available months for dropdown
    const months = Array.from(new Set(
      enhancedTransactions.map(t => format(t.date, 'yyyy-MM'))
    )).sort((a, b) => b.localeCompare(a));

    // Filter by selected month/year
    let filtered = enhancedTransactions;
    if (selectedMonthYear !== "all") {
      filtered = enhancedTransactions.filter(t => 
        format(t.date, 'yyyy-MM') === selectedMonthYear
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.category?.name.toLowerCase().includes(searchLower) ||
        t.account?.name.toLowerCase().includes(searchLower)
      );
    }

    // Group filtered transactions by month
    const grouped: Record<string, typeof filtered> = {};
    filtered.forEach(transaction => {
      const monthKey = format(transaction.date, 'yyyy-MM');
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(transaction);
    });

    return { 
      transactionsByMonth: grouped, 
      availableMonths: months,
      filteredTransactions: filtered
    };
  }, [expenses, categories, accounts, selectedMonthYear, searchTerm]);

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) {
      return "Hoje";
    }
    if (isYesterday(date)) {
      return "Ontem";
    }
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const getMonthLabel = (monthKey: string) => {
    const date = new Date(`${monthKey}-01`);
    if (isThisYear(date)) {
      return format(date, "MMMM", { locale: ptBR });
    }
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  const calculateMonthTotal = (transactions: any[]) => {
    return transactions.reduce((total, t) => total + parseFloat(t.amount), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Todas as Transações</h1>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por descrição, categoria ou conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  {availableMonths.map((monthKey) => {
                    const date = new Date(`${monthKey}-01`);
                    const label = isThisYear(date) 
                      ? format(date, "MMMM", { locale: ptBR })
                      : format(date, "MMMM 'de' yyyy", { locale: ptBR });
                    return (
                      <SelectItem key={monthKey} value={monthKey}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(searchTerm || selectedMonthYear !== "all") && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                {filteredTransactions.length} transação(ões) encontrada(s)
                {selectedMonthYear !== "all" && (
                  <span> em {getMonthLabel(selectedMonthYear)}</span>
                )}
                {searchTerm && (
                  <span> com "{searchTerm}"</span>
                )}
              </span>
              {(searchTerm || selectedMonthYear !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedMonthYear("all");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(transactionsByMonth).length === 0 ? (
        <Card className="shadow-sm border-gray-100">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedMonthYear !== "all" ? (
                <>
                  <p>Nenhuma transação encontrada com os filtros aplicados</p>
                  <p className="text-sm">Tente ajustar os filtros de busca</p>
                </>
              ) : (
                <>
                  <p>Nenhuma transação encontrada</p>
                  <p className="text-sm">Adicione sua primeira despesa!</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(transactionsByMonth).map(([monthKey, transactions]) => {
          const monthTotal = calculateMonthTotal(transactions);
          
          return (
            <Card key={monthKey} className="shadow-sm border-gray-100">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold capitalize">
                    {getMonthLabel(monthKey)}
                  </CardTitle>
                  <span className="text-lg font-semibold text-red-600">
                    -{formatCurrency(monthTotal)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${transaction.category?.color}20` }}
                        >
                          <span style={{ color: transaction.category?.color }}>
                            {transaction.category?.icon || '💰'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {formatDateLabel(transaction.date)}
                            {transaction.account && ` • ${transaction.account.name}`}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}