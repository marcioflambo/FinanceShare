import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getRelativeTime } from "@/lib/utils";
import { useMemo, useState } from "react";
import { AccountSelector } from "./account-selector";
import { EditExpenseModal } from "./edit-expense-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Edit2 } from "lucide-react";
import type { Expense, Category, BankAccount } from "@shared/schema";

interface RecentTransactionsProps {
  onViewAll?: () => void;
  selectedAccountIds?: number[];
  onAccountSelectionChange?: (accountIds: number[]) => void;
}

export function RecentTransactions({ onViewAll, selectedAccountIds = [], onAccountSelectionChange }: RecentTransactionsProps) {
  const isMobile = useIsMobile();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingExpense(null);
  };

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
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 group">
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
                    <p className="font-medium text-gray-900 text-sm md:text-base">{transaction.description}</p>
                    <p className="text-xs md:text-sm text-gray-600">
                      {getRelativeTime(transaction.date)}
                      {transaction.account && ` • ${transaction.account.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold text-sm md:text-base ${
                    transaction.transactionType === 'credit' 
                      ? 'text-green-600' 
                      : transaction.transactionType === 'transfer_in'
                      ? 'text-blue-600'
                      : transaction.transactionType === 'transfer_out'
                      ? 'text-orange-600'
                      : transaction.transactionType === 'transfer'
                      ? 'text-blue-600'
                      : 'text-red-600'
                  }`}>
                    {transaction.transactionType === 'credit' 
                      ? '+' 
                      : transaction.transactionType === 'transfer_in'
                      ? '+'
                      : transaction.transactionType === 'transfer_out'
                      ? '-'
                      : transaction.transactionType === 'transfer'
                      ? ''
                      : '-'
                    }{formatCurrency(transaction.amount)}
                  </span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditExpense(transaction)}
                      className="h-8 w-8 p-0 hover:bg-blue-50"
                    >
                      <Edit2 className="h-3 w-3 text-blue-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      <EditExpenseModal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        expense={editingExpense}
      />
    </Card>
  );
}
