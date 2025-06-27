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
  amount: z.string().min(1, "Valor é obrigatório").refine((val) => {
    const numVal = parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.'));
    return !isNaN(numVal) && numVal > 0;
  }, "Valor deve ser maior que zero"),
  categoryName: z.string().min(1, "Categoria é obrigatória"),
  accountId: z.string().min(1, "Conta é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  installments: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  preselectedAccountId?: number | null;
}

export function ExpenseModal({ open, onClose, preselectedAccountId }: ExpenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const [amountValue, setAmountValue] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      categoryName: "",
      accountId: "",
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurrenceType: undefined,
      installments: "",
    },
  });

  // Pre-select account when modal opens or preselectedAccountId changes
  useEffect(() => {
    if (open && preselectedAccountId) {
      form.setValue('accountId', preselectedAccountId.toString());
    }
  }, [open, preselectedAccountId, form]);

  const isRecurring = form.watch("isRecurring");

  const formatCurrency = (value: string) => {
    const numValue = value.replace(/[^\d]/g, '');
    if (!numValue) return '';
    const formatted = (parseInt(numValue) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatted;
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setAmountValue(formatted);
    const numericValue = value.replace(/[^\d]/g, '');
    const decimalValue = numericValue ? (parseInt(numericValue) / 100).toString() : '';
    form.setValue('amount', decimalValue);
  };

  // Get top 3 most used categories
  const topCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories.slice(0, 3);
  }, [categories]);

  const createExpenseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // First, find or create the category
      let categoryId = null;
      const existingCategory = categories.find(cat => 
        cat.name.toLowerCase() === data.categoryName.toLowerCase()
      );
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create new category
        const newCategoryResponse = await apiRequest("POST", "/api/categories", {
          name: data.categoryName,
          icon: "fas fa-circle",
          color: "#6B7280",
        }) as any;
        categoryId = newCategoryResponse.id;
      }

      const payload = {
        description: data.description,
        amount: parseFloat(data.amount),
        categoryId: categoryId,
        accountId: parseInt(data.accountId),
        date: data.date,
        isRecurring: data.isRecurring,
        recurrenceType: data.recurrenceType,
        installments: data.installments ? parseInt(data.installments) : undefined,
      };
      await apiRequest("POST", "/api/expenses", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Despesa adicionada",
        description: "Sua despesa foi registrada com sucesso!",
      });
      form.reset();
      setAmountValue("");
      setCategoryOpen(false);
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a despesa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Despesa</DialogTitle>
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
                    <Input placeholder="Ex: Almoço no restaurante" {...field} />
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
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">R$</span>
                      <Input 
                        placeholder="0,00" 
                        className="pl-8"
                        value={amountValue}
                        onChange={(e) => handleAmountChange(e.target.value)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryName"
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
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Digite ou selecione uma categoria"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Digite uma categoria..." 
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="flex items-center space-x-2 p-2">
                              <Plus className="h-4 w-4" />
                              <span>Criar "{field.value}"</span>
                            </div>
                          </CommandEmpty>
                          <CommandGroup heading="Mais usadas">
                            {topCategories.map((category) => (
                              <CommandItem
                                key={category.id}
                                value={category.name}
                                onSelect={() => {
                                  field.onChange(category.name);
                                  setCategoryOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === category.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center space-x-2">
                                  <i className={`${category.icon} text-sm`} style={{ color: category.color }}></i>
                                  <span>{category.name}</span>
                                </div>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name} - {account.type === 'checking' ? 'Corrente' : 
                                           account.type === 'savings' ? 'Poupança' : 'Digital'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Despesa Recorrente
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Esta despesa se repete automaticamente
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {isRecurring && (
              <>
                <FormField
                  control={form.control}
                  name="recurrenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
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
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Repetições (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Deixe vazio para repetir indefinidamente"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createExpenseMutation.isPending}
              >
                {createExpenseMutation.isPending ? "Salvando..." : "Salvar Despesa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
