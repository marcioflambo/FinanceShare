import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getRelativeTime } from "@/lib/utils";
import { useMemo } from "react";
import { AccountSelector } from "./account-selector";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Expense, Category, BankAccount } from "@shared/schema";

interface RecentTransactionsProps {
  onViewAll?: () => void;
  selectedAccountIds?: number[];
  onAccountSelectionChange?: (accountIds: number[]) => void;
}

export function RecentTransactions({ onViewAll, selectedAccountIds = [], onAccountSelectionChange }: RecentTransactionsProps) {
  const isMobile = useIsMobile();
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
    // Filter accounts based on selection and device type
    let accountIds: number[];
    if (selectedAccountIds.length > 0) {
      if (isMobile) {
        // On mobile, show only the first selected account since multi-select doesn't work
        accountIds = [selectedAccountIds[0]];
      } else {
        // On desktop, show all selected accounts
        accountIds = selectedAccountIds;
      }
    } else {
      // Show all active accounts if no accounts are selected
      accountIds = accounts
        .filter(account => account.isActive !== false)
        .map(account => account.id);
    }

    return expenses
      .filter(expense => accountIds.includes(expense.accountId))
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
  }, [expenses, categories, accounts, selectedAccountIds]);

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader>
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-primary/80"
              onClick={onViewAll}
            >
              Ver todas
            </Button>
          </div>
          
          {onAccountSelectionChange && (
            <div className="w-full">
              <AccountSelector
                selectedAccountIds={selectedAccountIds}
                onSelectionChange={onAccountSelectionChange}
              />
            </div>
          )}
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
                    <p className="font-medium text-gray-900 text-sm">{transaction.description}</p>
                    <p className="text-xs text-gray-600">
                      {getRelativeTime(transaction.date)}
                      {transaction.account && ` • ${transaction.account.name}`}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600 text-sm">
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
