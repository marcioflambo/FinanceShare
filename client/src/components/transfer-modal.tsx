import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency } from "@/lib/utils";
import { ArrowRightLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BankAccount } from "@shared/schema";

const formSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string()
    .min(1, "Valor é obrigatório")
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valor deve ser maior que zero"),
  fromAccountId: z.string().min(1, "Conta de origem é obrigatória"),
  toAccountId: z.string().min(1, "Conta de destino é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
}).refine(data => data.fromAccountId !== data.toAccountId, {
  message: "Contas de origem e destino devem ser diferentes",
  path: ["toAccountId"],
});

type FormData = z.infer<typeof formSchema>;

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
}

export function TransferModal({ open, onClose }: TransferModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  // Filter to only show active accounts
  const activeAccounts = accounts.filter(account => account.isActive !== false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      fromAccountId: "",
      toAccountId: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("/api/transfers", "POST", {
        ...data,
        amount: parseFloat(data.amount).toFixed(2),
        fromAccountId: parseInt(data.fromAccountId),
        toAccountId: parseInt(data.toAccountId),
        date: new Date(data.date),
        userId: 1, // Hardcoded for demo
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Transferência realizada!",
        description: "A transferência entre contas foi realizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao realizar transferência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createTransferMutation.mutate(data);
  };

  const selectedFromAccount = activeAccounts.find(acc => acc.id === parseInt(form.watch("fromAccountId")));
  const selectedToAccount = activeAccounts.find(acc => acc.id === parseInt(form.watch("toAccountId")));
  const transferAmount = parseFloat(form.watch("amount") || "0");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferência entre Contas
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Pagamento cartão de crédito, Poupança..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de Origem</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              <div className="flex flex-col">
                                <span className="font-medium">{account.name}</span>
                                <span className="text-sm text-gray-500">
                                  {formatCurrency(account.balance)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de Destino</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeAccounts.map((account) => (
                            <SelectItem 
                              key={account.id} 
                              value={account.id.toString()}
                              disabled={account.id.toString() === form.watch("fromAccountId")}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{account.name}</span>
                                <span className="text-sm text-gray-500">
                                  {formatCurrency(account.balance)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedFromAccount && transferAmount > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Prévia da transferência
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{selectedFromAccount.name}:</span>
                    <span className="text-red-600">
                      -{formatCurrency(transferAmount.toFixed(2))}
                    </span>
                  </div>
                  {selectedToAccount && (
                    <div className="flex justify-between">
                      <span>{selectedToAccount.name}:</span>
                      <span className="text-green-600">
                        +{formatCurrency(transferAmount.toFixed(2))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTransferMutation.isPending}
                className="flex-1"
              >
                {createTransferMutation.isPending ? "Processando..." : "Transferir"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}