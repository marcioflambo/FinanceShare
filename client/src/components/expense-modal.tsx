import { useState, useMemo, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category, BankAccount } from "@shared/schema";

const formSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),  
  amount: z.string().min(1, "Valor é obrigatório"),
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  accountId: z.number().min(1, "Conta é obrigatória"),
  transactionType: z.enum(["debit", "credit"]).default("debit"),
  date: z.date().default(() => new Date()),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
  installmentCount: z.number().min(1).default(1),
  isInstallment: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  preselectedAccountId?: number;
}

export function ExpenseModal({ open, onClose, preselectedAccountId }: ExpenseModalProps) {
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
      accountId: preselectedAccountId || 0,
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

  const transactionType = form.watch("transactionType");
  const isRecurring = form.watch("isRecurring");
  const isInstallment = form.watch("isInstallment");

  // Filter and sort categories based on usage
  const { filteredCategories, topCategories } = useMemo(() => {
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    // Get top 3 most used categories (by ID for now - would be better to track usage)
    const top = categories.slice(0, 3);

    return { filteredCategories: filtered, topCategories: top };
  }, [categories, categorySearch]);

  const createExpenseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        description: data.description,
        amount: parseFloat(data.amount),
        categoryId: data.categoryId,
        accountId: data.accountId,
        date: data.date,
        isRecurring: data.isRecurring,
        recurringFrequency: data.recurringFrequency,
        installmentCount: data.installmentCount,
        isInstallment: data.isInstallment,
      };

      // Create expense or income based on transaction type
      if (data.transactionType === "credit") {
        return await apiRequest("/api/income", "POST", payload);
      } else {
        return await apiRequest("/api/expenses", "POST", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: transactionType === "credit" ? "Receita adicionada!" : "Despesa adicionada!",
        description: "A transação foi registrada com sucesso.",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createExpenseMutation.mutate(data);
  };

  const handleAddCategory = async (name: string) => {
    try {
      const newCategory = await apiRequest("/api/categories", "POST", { name });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Transação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>

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
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? categories.find((category) => category.id === field.value)?.name
                            : "Selecionar categoria"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar categoria..."
                          value={categorySearch}
                          onValueChange={setCategorySearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="text-center py-2">
                              <p className="text-sm text-muted-foreground mb-2">
                                Categoria não encontrada
                              </p>
                              {categorySearch && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddCategory(categorySearch)}
                                  className="text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Criar "{categorySearch}"
                                </Button>
                              )}
                            </div>
                          </CommandEmpty>
                          
                          {topCategories.length > 0 && !categorySearch && (
                            <CommandGroup heading="Mais usadas">
                              {topCategories.map((category) => (
                                <CommandItem
                                  value={category.name}
                                  key={category.id}
                                  onSelect={() => {
                                    form.setValue("categoryId", category.id);
                                    setCategoryOpen(false);
                                  }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <i
                                      className={category.icon}
                                      style={{ color: category.color }}
                                    ></i>
                                    <span>{category.name}</span>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      category.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}

                          <CommandGroup heading={categorySearch ? "Resultados" : "Todas as categorias"}>
                            {filteredCategories.map((category) => (
                              <CommandItem
                                value={category.name}
                                key={category.id}
                                onSelect={() => {
                                  form.setValue("categoryId", category.id);
                                  setCategoryOpen(false);
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <i
                                    className={category.icon}
                                    style={{ color: category.color }}
                                  ></i>
                                  <span>{category.name}</span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    category.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
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

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
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
                            <i className="fas fa-university text-blue-500"></i>
                            <span>{account.name}</span>
                            {account.isActive === false && (
                              <span className="text-xs text-gray-500">(Inativa)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked: boolean) => form.setValue("isRecurring", checked)}
                />
                <label htmlFor="recurring" className="text-sm font-medium">
                  Transação recorrente
                </label>
              </div>

              {isRecurring && (
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar frequência" />
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
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="installment"
                  checked={isInstallment}
                  onCheckedChange={(checked: boolean) => form.setValue("isInstallment", checked)}
                />
                <label htmlFor="installment" className="text-sm font-medium">
                  Parcelamento
                </label>
              </div>

              {isInstallment && (
                <FormField
                  control={form.control}
                  name="installmentCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose} type="button">
                Cancelar
              </Button>
              <Button type="submit" disabled={createExpenseMutation.isPending}>
                {createExpenseMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}