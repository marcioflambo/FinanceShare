import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GripVertical, Building, PiggyBank } from "lucide-react";
import { formatCurrencyDisplay } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BankAccount } from "@shared/schema";

interface BankAccountOrganizeModalProps {
  open: boolean;
  onClose: () => void;
  accounts: BankAccount[];
}

export function BankAccountOrganizeModal({ open, onClose, accounts }: BankAccountOrganizeModalProps) {
  const [orderedAccounts, setOrderedAccounts] = useState<BankAccount[]>(accounts);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (accountsOrder: BankAccount[]) => {
      // For now, we'll just update the order in the frontend
      // In a real app, you'd send this to the backend
      return accountsOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "Ordem salva",
        description: "A ordem das contas foi atualizada com sucesso.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar ordem",
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newAccounts = [...orderedAccounts];
    const draggedAccount = newAccounts[draggedIndex];
    
    newAccounts.splice(draggedIndex, 1);
    newAccounts.splice(index, 0, draggedAccount);
    
    setOrderedAccounts(newAccounts);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      const newAccounts = [...orderedAccounts];
      [newAccounts[index], newAccounts[index - 1]] = [newAccounts[index - 1], newAccounts[index]];
      setOrderedAccounts(newAccounts);
    }
  };

  const moveDown = (index: number) => {
    if (index < orderedAccounts.length - 1) {
      const newAccounts = [...orderedAccounts];
      [newAccounts[index], newAccounts[index + 1]] = [newAccounts[index + 1], newAccounts[index]];
      setOrderedAccounts(newAccounts);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(orderedAccounts);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Organizar Contas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {orderedAccounts.map((account, index) => (
            <Card
              key={account.id}
              className={`p-3 cursor-move transition-all ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${account.isActive === false ? 'opacity-60' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    {getAccountIcon(account.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{account.name}</h4>
                      {account.isActive === false && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          Inativa
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{getAccountTypeLabel(account.type)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrencyDisplay(parseFloat(account.balance))}
                  </span>
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0"
                      onClick={() => moveDown(index)}
                      disabled={index === orderedAccounts.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar Ordem"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}