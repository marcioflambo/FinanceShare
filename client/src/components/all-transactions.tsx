import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";
import { format, isThisYear, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import type { Expense, Category, BankAccount } from "@shared/schema";

interface AllTransactionsProps {
  onBack: () => void;
}

export function AllTransactions({ onBack }: AllTransactionsProps) {
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const transactionsByMonth = useMemo(() => {
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

    // Group by month
    const grouped: Record<string, typeof enhancedTransactions> = {};
    
    enhancedTransactions.forEach(transaction => {
      const monthKey = format(transaction.date, 'yyyy-MM');
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(transaction);
    });

    return grouped;
  }, [expenses, categories, accounts]);

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

      {Object.keys(transactionsByMonth).length === 0 ? (
        <Card className="shadow-sm border-gray-100">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma transação encontrada</p>
              <p className="text-sm">Adicione sua primeira despesa!</p>
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