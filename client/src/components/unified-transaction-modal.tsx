import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Plus, ArrowLeftRight, Repeat, CreditCard } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BankAccount, Category } from "@shared/schema";

const transactionTypes = [
  { value: "expense", label: "Débito", icon: CreditCard, color: "bg-red-500" },
  { value: "income", label: "Crédito", icon: Plus, color: "bg-green-500" },
  { value: "transfer", label: "Transferir", icon: ArrowLeftRight, color: "bg-blue-500" },
  { value: "recurring", label: "Recorrente", icon: Repeat, color: "bg-purple-500" },
];

const formSchema = z.object({
  type: z.enum(["expense", "income", "transfer", "recurring"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  date: z.date(),
  categoryId: z.number().min(1, "Categoria é obrigatória").optional(),
  accountId: z.number().min(1, "Conta é obrigatória"),
  toAccountId: z.number().min(1, "Conta destino é obrigatória").optional(),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(["none", "installment", "advanced"]).default("none"),
  recurringFrequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  recurringInterval: z.number().min(1).default(1),
  installmentTotal: z.number().min(1).optional(),
  recurringEndDate: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UnifiedTransactionModalProps {
  open: boolean;
  onClose: () => void;
  preselectedAccountId?: number;
}

export function UnifiedTransactionModal({ open, onClose, preselectedAccountId }: UnifiedTransactionModalProps) {
  const [activeTab, setActiveTab] = useState("type");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      date: new Date(),
      accountId: preselectedAccountId || 0,
      isRecurring: false,
      recurringType: "none",
      recurringInterval: 1,
    },
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const transactionType = form.watch("type");
  const isRecurring = form.watch("isRecurring");
  const recurringType = form.watch("recurringType");

  const createExpenseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        description: data.description,
        amount: data.amount,
        date: data.date,
        categoryId: data.categoryId,
        accountId: data.accountId,
        isRecurring: data.isRecurring,
        recurringType: data.recurringType,
        recurringFrequency: data.recurringFrequency,
        recurringInterval: data.recurringInterval,
        installmentTotal: data.installmentTotal,
        recurringEndDate: data.recurringEndDate,
      };
      return await apiRequest("/api/expenses", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Transação criada com sucesso!",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        description: data.description,
        amount: data.amount,
        date: data.date,
        fromAccountId: data.accountId,
        toAccountId: data.toAccountId,
      };
      return await apiRequest("/api/transfers", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Transferência realizada com sucesso!",
      });
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
    if (data.type === "transfer") {
      createTransferMutation.mutate(data);
    } else {
      // For recurring type, set isRecurring to true
      if (data.type === "recurring") {
        data.isRecurring = true;
        data.recurringType = "installment"; // Default to installment
      }
      createExpenseMutation.mutate(data);
    }
  };

  const getTransactionIcon = () => {
    const type = transactionTypes.find(t => t.value === transactionType);
    const Icon = type?.icon || Plus;
    return <Icon className="h-5 w-5" />;
  };

  const requiresCategory = transactionType === "expense" || transactionType === "income" || transactionType === "recurring";
  const requiresToAccount = transactionType === "transfer";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {getTransactionIcon()}
            Adicionar Transação
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="type">Tipo</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="options">Opções</TabsTrigger>
              </TabsList>

              <TabsContent value="type" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transactionTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = transactionType === type.value;
                    return (
                      <Card
                        key={type.value}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg",
                          isSelected && "ring-2 ring-primary"
                        )}
                        onClick={() => {
                          form.setValue("type", type.value as any);
                          // Reset fields when changing type
                          if (type.value !== "recurring") {
                            form.setValue("isRecurring", false);
                            form.setValue("recurringType", "none");
                          }
                        }}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-3 text-base">
                            <div className={cn("p-2 rounded-full text-white", type.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            {type.label}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Supermercado" {...field} />
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

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Selecionar data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar conta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bankAccounts.map((account) => (
                              <SelectItem key={account.id} value={String(account.id)}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {requiresToAccount && (
                    <FormField
                      control={form.control}
                      name="toAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta Destino</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value || "")}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar conta destino" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bankAccounts
                                .filter(account => account.id !== form.getValues("accountId"))
                                .map((account) => (
                                  <SelectItem key={account.id} value={String(account.id)}>
                                    {account.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {requiresCategory && (
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value || "")}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                  <div className="flex items-center gap-2">
                                    <i className={category.icon} style={{ color: category.color }} />
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                {transactionType === "recurring" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Configurações de Recorrência
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="recurringType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Recorrência</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="installment">Parcelamento</SelectItem>
                                <SelectItem value="advanced">Avançado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {recurringType === "installment" && (
                        <FormField
                          control={form.control}
                          name="installmentTotal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Parcelas</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="12"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {recurringType === "advanced" && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="recurringFrequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frequência</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="daily">Diário</SelectItem>
                                    <SelectItem value="weekly">Semanal</SelectItem>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                    <SelectItem value="yearly">Anual</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="recurringInterval"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Intervalo</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createExpenseMutation.isPending || createTransferMutation.isPending}
              >
                {createExpenseMutation.isPending || createTransferMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}