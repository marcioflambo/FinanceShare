import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Target, Calendar, DollarSign, Hash } from "lucide-react";
import type { BankAccount } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  targetAmount: z.string().min(1, "Valor da meta é obrigatório").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser maior que zero"),
  targetDate: z.string().optional(),
  color: z.string().min(1, "Cor é obrigatória"),
  icon: z.string().min(1, "Ícone é obrigatório"),
});

type FormData = z.infer<typeof formSchema>;

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
}

const goalPresets = [
  { name: "Viagem", icon: "fas fa-plane", color: "#3B82F6" },
  { name: "Casa Própria", icon: "fas fa-home", color: "#10B981" },
  { name: "Carro", icon: "fas fa-car", color: "#F59E0B" },
  { name: "Emergência", icon: "fas fa-shield-alt", color: "#EF4444" },
  { name: "Aposentadoria", icon: "fas fa-clock", color: "#8B5CF6" },
  { name: "Educação", icon: "fas fa-graduation-cap", color: "#06B6D4" },
  { name: "Casamento", icon: "fas fa-heart", color: "#EC4899" },
  { name: "Notebook", icon: "fas fa-laptop", color: "#6B7280" },
];

const colorOptions = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
  "#8B5CF6", "#06B6D4", "#EC4899", "#6B7280"
];

export function GoalModal({ open, onClose }: GoalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

  const { data: accounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      targetAmount: "",
      targetDate: "",
      color: "#3B82F6",
      icon: "fas fa-target",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: FormData & { accounts: number[] }) => {
      await apiRequest("/api/goals", "POST", {
        name: data.name,
        description: data.description,
        targetAmount: parseFloat(data.targetAmount),
        targetDate: data.targetDate || null,
        color: data.color,
        icon: data.icon,
        accounts: data.accounts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Meta criada",
        description: "Sua meta financeira foi criada com sucesso!",
      });
      form.reset();
      setSelectedAccounts([]);
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const selectPreset = (preset: typeof goalPresets[0]) => {
    form.setValue("name", preset.name);
    form.setValue("color", preset.color);
    form.setValue("icon", preset.icon);
  };

  const toggleAccount = (accountId: number) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const getTotalSelectedBalance = () => {
    return selectedAccounts.reduce((total, accountId) => {
      const account = accounts.find(a => a.id === accountId);
      return total + (account ? parseFloat(account.balance) : 0);
    }, 0);
  };

  const onSubmit = (data: FormData) => {
    if (selectedAccounts.length === 0) {
      toast({
        title: "Selecione pelo menos uma conta",
        description: "Você precisa vincular pelo menos uma conta bancária à sua meta.",
        variant: "destructive",
      });
      return;
    }

    createGoalMutation.mutate({ ...data, accounts: selectedAccounts });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Nova Meta Financeira</span>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Presets */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Metas Populares
              </label>
              <div className="grid grid-cols-4 gap-2">
                {goalPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className="p-3 rounded-lg border hover:border-primary transition-colors text-center"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center"
                      style={{ backgroundColor: `${preset.color}20` }}
                    >
                      <i 
                        className={`${preset.icon} text-sm`}
                        style={{ color: preset.color }}
                      ></i>
                    </div>
                    <span className="text-xs text-gray-600">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Meta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Viagem para Europa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Meta</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2 w-4 h-4 text-gray-500" />
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00" 
                          className="pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva sua meta..."
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Alvo (opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2 w-4 h-4 text-gray-500" />
                      <Input 
                        type="date" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Selection */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor da Meta</FormLabel>
                  <FormControl>
                    <div className="flex space-x-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            field.value === color ? 'border-gray-400' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Contas Vinculadas
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Selecione as contas que contribuirão para esta meta. O saldo dessas contas será somado para calcular o progresso.
              </p>
              
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div 
                    key={account.id} 
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedAccounts.includes(account.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleAccount(account.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          checked={selectedAccounts.includes(account.id)}
                          onCheckedChange={() => {}}
                        />
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: account.color }}
                        >
                          {account.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{account.name}</p>
                            {account.isActive === false && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                Inativa
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {account.type === 'checking' ? 'Conta Corrente' :
                             account.type === 'savings' ? 'Poupança' : 'Digital'}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedAccounts.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">
                      Total nas contas selecionadas:
                    </span>
                    <span className="font-bold text-green-900">
                      {formatCurrency(getTotalSelectedBalance())}
                    </span>
                  </div>
                </div>
              )}
            </div>

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
                disabled={createGoalMutation.isPending}
              >
                {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}