import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DescriptionInput } from "@/components/ui/description-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Check, ChevronsUpDown, Plus, CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category, BankAccount, Expense } from "@shared/schema";

const formSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),  
  amount: z.string().min(1, "Valor é obrigatório"),
  categoryId: z.number().min(1, "Categoria é obrigatória").optional(),
  accountId: z.number().min(1, "Conta é obrigatória"),
  toAccountId: z.number().min(1, "Conta destino é obrigatória").optional(),
  transactionType: z.enum(["debit", "credit", "transfer"]).default("debit"),
  date: z.date().default(() => new Date()),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
  installmentCount: z.number().min(1).default(1),
  isInstallment: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface EditExpenseModalProps {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export function EditExpenseModal({ open, onClose, expense }: EditExpenseModalProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      categoryId: 0,
      accountId: 0,
      transactionType: "debit",
      date: new Date(),
      isRecurring: false,
      recurringFrequency: "monthly",
      installmentCount: 1,
      isInstallment: false,
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const transactionType = form.watch("transactionType");
  const isRecurring = form.watch("isRecurring");
  const isInstallment = form.watch("isInstallment");

  // Get most used categories (top 3)
  const mostUsedCategories = useMemo(() => {
    const categoryCount = new Map<number, number>();
    expenses.forEach(expense => {
      const count = categoryCount.get(expense.categoryId) || 0;
      categoryCount.set(expense.categoryId, count + 1);
    });
    
    return Array.from(categoryCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([categoryId]) => categories.find(cat => cat.id === categoryId))
      .filter(Boolean) as Category[];
  }, [expenses, categories]);

  // Filter and sort categories based on usage
  const { filteredCategories, topCategories } = useMemo(() => {
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    return { filteredCategories: filtered, topCategories: mostUsedCategories };
  }, [categories, categorySearch, mostUsedCategories]);

  // Update form when expense changes
  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        amount: expense.amount,
        date: new Date(expense.date),
        categoryId: expense.categoryId,
        accountId: expense.accountId,
        transactionType: "debit",
        isRecurring: expense.isRecurring || false,
        recurringFrequency: (expense.recurringFrequency as "weekly" | "monthly" | "yearly") || "monthly",
        installmentCount: expense.installmentTotal || 1,
        isInstallment: expense.recurringType === "installment",
      });
    }
  }, [expense, form]);

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!expense) throw new Error("Nenhuma despesa selecionada");
      
      const payload = {
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId,
        accountId: data.accountId,
        date: data.date,
        transactionType: data.transactionType,
        isRecurring: data.isRecurring,
        recurringFrequency: data.recurringFrequency,
        installmentCount: data.installmentCount,
        isInstallment: data.isInstallment,
      };

      const response = await apiRequest(`/api/expenses/${expense.id}`, "PUT", payload);
      return await response.json();
    },
    onSuccess: async () => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      
      // Force refetch to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ["/api/expenses"] });
      await queryClient.refetchQueries({ queryKey: ["/api/statistics"] });
      
      // Clear any cached data
      queryClient.removeQueries({ queryKey: ["/api/expenses"] });
      
      toast({
        title: "Despesa atualizada!",
        description: "A despesa foi atualizada com sucesso.",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar despesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async () => {
      if (!expense) throw new Error("Nenhuma despesa selecionada");
      return await apiRequest(`/api/expenses/${expense.id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      
      toast({
        title: "Despesa excluída!",
        description: "A despesa foi excluída com sucesso.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir despesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async () => {
      if (!expense?.parentExpenseId) throw new Error("Transferência não encontrada");
      return await apiRequest(`/api/transfers/${expense.parentExpenseId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      
      toast({
        title: "Transferência excluída!",
        description: "A transferência completa foi excluída com sucesso.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir transferência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateExpenseMutation.mutate(data);
  };

  const handleDelete = () => {
    // Verificar se é uma transação de transferência
    const isTransferTransaction = expense?.transactionType === 'transfer_in' || expense?.transactionType === 'transfer_out';
    
    if (isTransferTransaction) {
      // Para transferências, sempre excluir toda a transferência para manter consistência
      if (confirm(
        "Esta é uma transação de transferência entre contas.\n\n" +
        "AVISO: Ao excluir, AMBAS as transações da transferência serão removidas " +
        "(entrada na conta destino e saída na conta origem) para manter a consistência dos saldos.\n\n" +
        "Deseja continuar?"
      )) {
        deleteTransferMutation.mutate();
      }
    } else {
      // Transação normal
      if (confirm("Tem certeza que deseja excluir esta despesa?")) {
        deleteExpenseMutation.mutate();
      }
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const newCategory = await apiRequest("/api/categories", "POST", { name }) as any;
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.setValue("categoryId", newCategory.id);
      setCategoryOpen(false);
      setCategorySearch("");
    } catch (error) {
      toast({
        title: "Erro ao criar categoria",
        description: "Não foi possível criar a nova categoria.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="edit-expense-description">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
        </DialogHeader>
        <div id="edit-expense-description" className="sr-only">
          Formulário para editar os dados de uma despesa existente
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Transação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="debit">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-minus-circle text-red-500"></i>
                          <span>Débito (Despesa)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="credit">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-plus-circle text-green-500"></i>
                          <span>Crédito (Receita)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="transfer">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-exchange-alt text-blue-500"></i>
                          <span>Transferência</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <DescriptionInput 
                        placeholder="Ex: Supermercado" 
                        value={field.value}
                        onChange={field.onChange}
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
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                      />
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

            {transactionType !== "transfer" && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Categoria</FormLabel>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={categoryOpen}
                            className="w-full justify-between"
                          >
                            {field.value && field.value > 0
                              ? categories.find((category) => category.id === field.value)?.name
                              : "Selecionar categoria"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar categoria..." 
                            value={categorySearch}
                            onValueChange={setCategorySearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="space-y-2">
                                <p>Nenhuma categoria encontrada.</p>
                                {categorySearch.trim() && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddCategory(categorySearch.trim())}
                                    className="w-full"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar "{categorySearch.trim()}"
                                  </Button>
                                )}
                              </div>
                            </CommandEmpty>
                            
                            {topCategories.length > 0 && !categorySearch && (
                              <CommandGroup heading="Mais usadas">
                                {topCategories.map((category) => (
                                  <CommandItem
                                    key={category.id}
                                    value={category.name}
                                    onSelect={() => {
                                      form.setValue("categoryId", category.id);
                                      setCategoryOpen(false);
                                      setCategorySearch("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === category.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <i className={`${category.icon} mr-2`} style={{ color: category.color }}></i>
                                    {category.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                            
                            <CommandGroup heading={categorySearch ? "Resultados" : "Todas as categorias"}>
                              {filteredCategories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.name}
                                  onSelect={() => {
                                    form.setValue("categoryId", category.id);
                                    setCategoryOpen(false);
                                    setCategorySearch("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === category.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <i className={`${category.icon} mr-2`} style={{ color: category.color }}></i>
                                  {category.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {transactionType === "transfer" ? "Conta origem" : "Conta"}
                    </FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: account.color }}
                              />
                              <span>{account.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {transactionType === "transfer" && (
                <FormField
                  control={form.control}
                  name="toAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta destino</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar conta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: account.color }}
                                />
                                <span>{account.name}</span>
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

            {transactionType !== "transfer" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Transação recorrente
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <div className="space-y-4 pl-6 border-l-2 border-gray-100">
                    <FormField
                      control={form.control}
                      name="isInstallment"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Parcelamento (valor será dividido)
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

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
                        name="installmentCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {isInstallment ? "Parcelas" : "Repetições"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="60"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={updateExpenseMutation.isPending}
              >
                {updateExpenseMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteExpenseMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}