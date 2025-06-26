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
import { Plus, Building, Smartphone, PiggyBank, MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BankAccount } from "@shared/schema";
import { BankAccountModal } from "./bank-account-modal";
import { useIsMobile } from "@/hooks/use-mobile";

export function BankAccounts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
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

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || accounts.length <= 1) return;
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX.current - endX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < accounts.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
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

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Contas</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Nova Conta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-6 text-center text-gray-500 border-dashed">
          <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Adicione sua primeira conta</p>
        </Card>
      ) : (
        <div className="relative">
          {/* Desktop: Horizontal scroll with arrows */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {accounts.map((account) => (
                  <Card
                    key={account.id}
                    className="relative flex-shrink-0 w-64 overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${account.color}15 0%, ${account.color}25 100%)`
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getAccountIcon(account.type)}
                            <span 
                              className="text-sm font-medium truncate"
                              style={{ color: account.color }}
                            >
                              {account.name}
                            </span>
                            {account.isActive === false && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                Inativa
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{getAccountTypeLabel(account.type)}</p>
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
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Saldo</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrencyDisplay(account.balance)}
                        </p>
                      </div>
                      {account.lastFourDigits && (
                        <p className="text-xs text-gray-400 mt-2">
                          **** {account.lastFourDigits}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Navigation arrows for desktop */}
              {accounts.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto');
                      if (container) {
                        container.scrollBy({ left: -270, behavior: 'smooth' });
                      }
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white shadow-md hover:bg-gray-50 text-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto');
                      if (container) {
                        container.scrollBy({ left: 270, behavior: 'smooth' });
                      }
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white shadow-md hover:bg-gray-50 text-gray-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile: Swipeable single account */}
          <div className="md:hidden">
            <div 
              className="relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Card
                className="relative overflow-hidden border-0 shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${accounts[currentIndex].color} 0%, ${accounts[currentIndex].color}DD 100%)`
                }}
              >
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getAccountIcon(accounts[currentIndex].type)}
                        <span className="text-lg font-medium">
                          {accounts[currentIndex].name}
                        </span>
                        {accounts[currentIndex].isActive === false && (
                          <span className="text-xs bg-black/20 px-2 py-1 rounded-full">
                            Inativa
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-75">
                        {getAccountTypeLabel(accounts[currentIndex].type)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-white hover:bg-white/20"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                  
                  <div className="mb-4">
                    <p className="text-sm opacity-75 mb-1">Saldo Disponível</p>
                    <p className="text-3xl font-bold">
                      {formatCurrencyDisplay(accounts[currentIndex].balance)}
                    </p>
                  </div>
                  
                  {accounts[currentIndex].lastFourDigits && (
                    <p className="text-sm opacity-75">
                      **** **** **** {accounts[currentIndex].lastFourDigits}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Navigation indicators and arrows for mobile */}
              {accounts.length > 1 && (
                <>
                  {/* Navigation dots */}
                  <div className="flex justify-center mt-3 gap-2">
                    {accounts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex 
                            ? 'bg-gray-800' 
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Navigation arrows for mobile */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevAccount}
                    disabled={currentIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 text-white hover:bg-black/30 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextAccount}
                    disabled={currentIndex === accounts.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 text-white hover:bg-black/30 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
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
    </div>
  );
}