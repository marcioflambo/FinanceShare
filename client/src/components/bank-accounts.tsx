import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatCurrencyDisplay } from "@/lib/currency";
import { Plus, Building, PiggyBank, MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BankAccount } from "@shared/schema";
import { BankAccountModal } from "./bank-account-modal";
import { BankAccountOrganizeModal } from "./bank-account-organize-modal";

export function BankAccounts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const startX = useRef<number>(0);
  
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
        title: "Conta excluída",
        description: "A conta foi excluída com sucesso.",
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
        return <Building className="w-4 h-4" style={{ color: '#3B82F6' }} />;
      case 'savings':
        return <PiggyBank className="w-4 h-4" style={{ color: '#10B981' }} />;
      case 'credit':
        return <i className="fas fa-credit-card text-sm" style={{ color: '#EF4444' }}></i>;
      case 'investment':
        return <i className="fas fa-chart-line text-sm" style={{ color: '#8B5CF6' }}></i>;
      default:
        return <Building className="w-4 h-4 text-gray-400" />;
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
      case 'investment':
        return 'Investimentos';
      default:
        return 'Conta';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startX.current) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX.current - endX;
    
    if (Math.abs(diffX) > 50) {
      if (diffX > 0 && currentIndex < accounts.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diffX < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
    
    startX.current = 0;
  };

  const nextAccount = () => {
    if (currentIndex < accounts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevAccount = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (accounts.length === 0) {
    return (
      <Card className="w-full md:w-80 h-32 p-4 text-center text-gray-500 border-dashed flex flex-col justify-center items-center">
        <Building className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-xs mb-2">Adicione sua primeira conta</p>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Adicionar Conta
        </Button>
        
        <BankAccountModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAccount(null);
          }}
          editingAccount={editingAccount}
        />
      </Card>
    );
  }

  return (
    <div className="w-full md:w-80">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Card
          className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow"
          style={{
            background: `linear-gradient(135deg, ${accounts[currentIndex]?.color}15 0%, ${accounts[currentIndex]?.color}25 100%)`
          }}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {getAccountIcon(accounts[currentIndex]?.type)}
                <div>
                  <span 
                    className="text-sm font-medium block"
                    style={{ color: accounts[currentIndex]?.color }}
                  >
                    {accounts[currentIndex]?.name}
                  </span>
                  <p className="text-xs text-gray-500">{getAccountTypeLabel(accounts[currentIndex]?.type)}</p>
                  {accounts[currentIndex]?.isActive === false && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                      Inativa
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setIsOrganizeModalOpen(true)}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Organizar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingAccount(accounts[currentIndex]);
                      setIsModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setAccountToDelete(accounts[currentIndex])}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="text-right mb-3">
              <p className="text-xs text-gray-500 mb-1">Saldo</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrencyDisplay(accounts[currentIndex]?.balance)}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {accounts.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevAccount}
                      disabled={currentIndex === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    
                    <span className="text-xs text-gray-500">
                      {currentIndex + 1} de {accounts.length}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextAccount}
                      disabled={currentIndex === accounts.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BankAccountModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAccount(null);
        }}
        editingAccount={editingAccount}
      />

      <AlertDialog open={accountToDelete !== null} onOpenChange={() => setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{accountToDelete?.name}"? Esta ação não pode ser desfeita.
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

      <BankAccountOrganizeModal
        open={isOrganizeModalOpen}
        onClose={() => setIsOrganizeModalOpen(false)}
        accounts={accounts}
      />
    </div>
  );
}