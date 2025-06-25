import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Plus, Building, Smartphone, PiggyBank } from "lucide-react";
import type { BankAccount } from "@shared/schema";

export function BankAccounts() {
  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Building className="w-4 h-4 opacity-75" />;
      case 'savings':
        return <PiggyBank className="w-4 h-4 opacity-75" />;
      default:
        return <Smartphone className="w-4 h-4 opacity-75" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking':
        return 'Conta Corrente';
      case 'savings':
        return 'Poupança';
      case 'credit':
        return 'Cartão de Crédito';
      default:
        return 'Conta Digital';
    }
  };

  return (
    <Card className="shadow-sm border-gray-100 mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Contas Bancárias</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Conta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma conta cadastrada</p>
            <p className="text-sm">Adicione suas contas bancárias para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-xl p-4 text-white relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${account.color} 0%, ${account.color}CC 100%)`
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm opacity-90">{account.name}</p>
                    <p className="text-xs opacity-75">{getAccountTypeLabel(account.type)}</p>
                  </div>
                  {getAccountIcon(account.type)}
                </div>
                <div className="mb-3">
                  <p className="text-xs opacity-75 mb-1">Saldo Disponível</p>
                  <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
                </div>
                {account.lastFourDigits && (
                  <p className="text-xs opacity-75">**** **** **** {account.lastFourDigits}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
