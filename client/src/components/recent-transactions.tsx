import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getRelativeTime } from "@/lib/utils";
import { useMemo } from "react";
import type { Expense, Category, BankAccount } from "@shared/schema";

export function RecentTransactions() {
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const recentTransactions = useMemo(() => {
    return expenses
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(expense => {
        const category = categories.find(c => c.id === expense.categoryId);
        const account = accounts.find(a => a.id === expense.accountId);
        return {
          ...expense,
          category,
          account
        };
      });
  }, [expenses, categories, accounts]);

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma transação encontrada</p>
              <p className="text-sm">Adicione sua primeira despesa!</p>
            </div>
          ) : (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${transaction.category?.color}20` }}
                  >
                    <i 
                      className={`${transaction.category?.icon || 'fas fa-circle'} text-sm`}
                      style={{ color: transaction.category?.color }}
                    ></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {getRelativeTime(transaction.date)}
                      {transaction.account && ` • ${transaction.account.name}`}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(transaction.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
