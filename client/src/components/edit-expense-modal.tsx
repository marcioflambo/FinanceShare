import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DescriptionInput } from "@/components/ui/description-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Edit2, Trash2, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BankAccount, Category, Expense } from "@shared/schema";

const formSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  date: z.date(),
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  accountId: z.number().min(1, "Conta é obrigatória"),
  customCategory: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditExpenseModalProps {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export function EditExpenseModal({ open, onClose, expense }: EditExpenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customCategory, setCustomCategory] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      date: new Date(),
      categoryId: 0,
      accountId: 0,
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

  // Calculate most used categories and descriptions
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

  const filteredCategories = useMemo(() => {
    if (!categoryFilter) return mostUsedCategories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(categoryFilter.toLowerCase())
    );
  }, [categories, categoryFilter, mostUsedCategories]);

  // Update form when expense changes
  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        amount: expense.amount,
        date: new Date(expense.date),
        categoryId: expense.categoryId,
        accountId: expense.accountId,
      });
    }
  }, [expense, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!expense) throw new Error("Nenhuma despesa selecionada");
      
      const payload = {
        ...data,
        amount: data.amount.toString(),
        userId: 1,
      };

      return apiRequest(`/api/expenses/${expense.id}`, "PUT", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Transação atualizada com sucesso!",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!expense) throw new Error("Nenhuma despesa selecionada");
      return apiRequest(`/api/expenses/${expense.id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Transação excluída com sucesso!",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await apiRequest("/api/categories", "POST", {
        name: categoryName,
        icon: "fas fa-circle",
        color: "#3B82F6",
        userId: 1,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });

  const onSubmit = async (data: FormData) => {
    let categoryId = data.categoryId;
    
    // If custom category is provided, create it first
    if (customCategory && customCategory.trim()) {
      try {
        const newCategory: any = await createCategoryMutation.mutateAsync(customCategory.trim());
        categoryId = newCategory.id;
      } catch (error) {
        toast({
          title: "Erro ao criar categoria",
          description: "Não foi possível criar a categoria personalizada",
          variant: "destructive",
        });
        return;
      }
    }
    
    updateMutation.mutate({
      ...data,
      categoryId,
    });
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteMutation.mutate();
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    form.setValue("categoryId", categoryId);
    setCustomCategory("");
    setCategoryFilter("");
  };

  const handleCustomCategorySubmit = () => {
    if (categoryFilter.trim()) {
      setCustomCategory(categoryFilter.trim());
      form.setValue("customCategory", categoryFilter.trim());
      setCategoryFilter("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Editar Transação
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <div className="space-y-2">
                      {customCategory ? (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border">
                          <i className="fas fa-circle text-blue-500" />
                          <span className="text-sm font-medium">{customCategory}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCustomCategory("");
                              form.setValue("customCategory", "");
                            }}
                            className="ml-auto h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Input
                              placeholder="Digite para buscar ou criar categoria..."
                              value={categoryFilter}
                              onChange={(e) => setCategoryFilter(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCustomCategorySubmit();
                                }
                              }}
                            />
                            {categoryFilter && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCategoryFilter("")}
                                className="absolute right-1 top-1 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          
                          {categoryFilter && !filteredCategories.some(cat => cat.name.toLowerCase() === categoryFilter.toLowerCase()) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCustomCategorySubmit}
                              className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Criar "{categoryFilter}"
                            </Button>
                          )}
                          
                          <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                            {filteredCategories.map((category) => (
                              <Button
                                key={category.id}
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCategorySelect(category.id)}
                                className="justify-start h-8"
                              >
                                <i className={category.icon} style={{ color: category.color }} />
                                <span className="ml-2">{category.name}</span>
                              </Button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
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
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                            <span>Selecione uma data</span>
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

            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </Button>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}