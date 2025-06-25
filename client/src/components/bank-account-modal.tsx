import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/currency";
import type { BankAccount } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Nome da conta é obrigatório"),
  type: z.enum(["checking", "savings", "credit"]),
  balance: z.string(),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface BankAccountModalProps {
  open: boolean;
  onClose: () => void;
  editingAccount?: BankAccount | null;
}

const accountTypes = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "credit", label: "Cartão de Crédito" },
];

const accountColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#84CC16", // Lime
];

export function BankAccountModal({ open, onClose, editingAccount }: BankAccountModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState(accountColors[0]);
  const isEditing = !!editingAccount;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "checking",
      balance: "0,00",
    },
  });



  // Atualizar os campos quando abrindo para edição
  useEffect(() => {
    if (editingAccount) {
      form.setValue("name", editingAccount.name);
      form.setValue("type", editingAccount.type as "checking" | "savings" | "credit");
      form.setValue("balance", formatCurrencyInput(editingAccount.balance.replace('.', '')));
      form.setValue("isActive", editingAccount.isActive !== false);
      setSelectedColor(editingAccount.color);
    } else {
      form.reset();
      form.setValue("balance", "0,00");
      form.setValue("isActive", true);
      setSelectedColor(accountColors[0]);
    }
  }, [editingAccount, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { 
        ...data, 
        color: selectedColor,
        balance: parseCurrencyInput(data.balance)
      };
      
      if (isEditing && editingAccount) {
        const response = await apiRequest("PUT", `/api/bank-accounts/${editingAccount.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/bank-accounts", payload);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: isEditing ? "Conta atualizada com sucesso!" : "Conta criada com sucesso!",
        description: isEditing ? "Os dados da conta foram atualizados." : "Sua nova conta bancária foi adicionada.",
      });
      form.reset();
      setSelectedColor(accountColors[0]);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: isEditing ? "Erro ao atualizar conta" : "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Conta" : "Adicionar Nova Conta"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações da sua conta bancária." 
              : "Adicione uma nova conta bancária para gerenciar suas finanças."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank, Banco do Brasil" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCurrencyInput(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Conta Ativa
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Contas inativas não aparecem no saldo total, mas podem ser usadas em metas
                    </div>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Cor da Conta</FormLabel>
              <div className="flex gap-2 flex-wrap">
                {accountColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending 
                  ? (isEditing ? "Atualizando..." : "Criando...") 
                  : (isEditing ? "Atualizar Conta" : "Criar Conta")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}