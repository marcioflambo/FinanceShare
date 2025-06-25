import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import { Plus, Building, Smartphone, PiggyBank, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BankAccount } from "@shared/schema";
import { BankAccountModal } from "./bank-account-modal";

export function BankAccounts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await apiRequest("DELETE", `/api/bank-accounts/${accountId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Conta excluída com sucesso!",
        description: "A conta bancária foi removida.",
      });
      setAccountToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive",
      });
    },
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80"
            onClick={() => setIsModalOpen(true)}
          >
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
                  <div className="flex items-center gap-2">
                    {getAccountIcon(account.type)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-white hover:bg-white/20"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingAccount(account);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAccountToDelete(account)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
      <BankAccountModal 
        open={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingAccount(null);
        }}
        editingAccount={editingAccount}
      />
      
      <AlertDialog open={!!accountToDelete} onOpenChange={() => setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{accountToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (accountToDelete) {
                  deleteMutation.mutate(accountToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
