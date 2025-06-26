import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { BankAccount } from "@shared/schema";

interface AccountFilterProps {
  selectedAccountIds: number[];
  onSelectionChange: (accountIds: number[]) => void;
}

export function AccountFilter({ selectedAccountIds, onSelectionChange }: AccountFilterProps) {
  const [open, setOpen] = useState(false);

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const activeAccounts = accounts.filter(account => account.isActive !== false);
  const selectedAccounts = activeAccounts.filter(account => selectedAccountIds.includes(account.id));

  const handleSelect = (accountId: number) => {
    if (selectedAccountIds.includes(accountId)) {
      // Remove from selection
      onSelectionChange(selectedAccountIds.filter(id => id !== accountId));
    } else {
      // Add to selection
      onSelectionChange([...selectedAccountIds, accountId]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Filtrar por Conta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedAccountIds.length === 0
                  ? "Selecionar contas..."
                  : selectedAccountIds.length === 1
                  ? selectedAccounts[0]?.name
                  : `${selectedAccountIds.length} contas selecionadas`}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar conta..." />
                <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
                <CommandGroup>
                  {activeAccounts.map((account) => (
                    <CommandItem
                      key={account.id}
                      value={account.name}
                      onSelect={() => handleSelect(account.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedAccountIds.includes(account.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-sm text-gray-500">{account.type}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedAccountIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Limpar seleção
            </Button>
          )}
          
          <div className="text-sm text-gray-500">
            {selectedAccountIds.length === 0
              ? "Mostrando todas as contas ativas"
              : `Mostrando ${selectedAccountIds.length} conta(s) selecionada(s)`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}