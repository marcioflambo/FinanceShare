import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, Building, PiggyBank, X } from "lucide-react";
import type { BankAccount } from "@shared/schema";

interface AccountSelectorProps {
  selectedAccountIds: number[];
  onSelectionChange: (accountIds: number[]) => void;
}

export function AccountSelector({ selectedAccountIds, onSelectionChange }: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const activeAccounts = accounts.filter(account => account.isActive !== false);
  const selectedAccounts = accounts.filter(account => selectedAccountIds.includes(account.id));

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Building className="w-3 h-3" style={{ color: '#3B82F6' }} />;
      case 'savings':
        return <PiggyBank className="w-3 h-3" style={{ color: '#10B981' }} />;
      case 'credit':
        return <i className="fas fa-credit-card text-xs" style={{ color: '#EF4444' }}></i>;
      case 'investment':
        return <i className="fas fa-chart-line text-xs" style={{ color: '#8B5CF6' }}></i>;
      default:
        return <Building className="w-3 h-3 text-gray-400" />;
    }
  };

  const handleAccountToggle = (accountId: number) => {
    if (selectedAccountIds.includes(accountId)) {
      onSelectionChange(selectedAccountIds.filter(id => id !== accountId));
    } else {
      onSelectionChange([...selectedAccountIds, accountId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAccountIds.length === activeAccounts.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(activeAccounts.map(account => account.id));
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (selectedAccountIds.length === 0) {
      return "Todas as contas ativas";
    } else if (selectedAccountIds.length === 1) {
      const account = selectedAccounts[0];
      return account?.name || "1 conta selecionada";
    } else {
      return `${selectedAccountIds.length} contas selecionadas`;
    }
  };

  return (
    <div className="space-y-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs h-8 border-gray-200 hover:border-gray-300"
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className="w-3 h-3 ml-2 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuItem onClick={handleSelectAll}>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 flex items-center justify-center">
                {selectedAccountIds.length === activeAccounts.length && (
                  <Check className="w-3 h-3" />
                )}
              </div>
              <span className="text-sm">
                {selectedAccountIds.length === activeAccounts.length ? "Desmarcar todas" : "Selecionar todas"}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {activeAccounts.map((account) => (
            <DropdownMenuCheckboxItem
              key={account.id}
              checked={selectedAccountIds.includes(account.id)}
              onCheckedChange={() => handleAccountToggle(account.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                {getAccountIcon(account.type)}
                <span className="text-sm font-medium" style={{ color: account.color }}>
                  {account.name}
                </span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected accounts badges - only show when multiple selected */}
      {selectedAccountIds.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {selectedAccounts.map((account) => (
            <span
              key={account.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border"
              style={{ backgroundColor: `${account.color}15`, color: account.color, borderColor: `${account.color}30` }}
            >
              {getAccountIcon(account.type)}
              <span className="max-w-20 truncate">{account.name}</span>
              <button
                onClick={() => handleAccountToggle(account.id)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-2 h-2" />
              </button>
            </span>
          ))}
          {selectedAccountIds.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
            >
              Limpar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}