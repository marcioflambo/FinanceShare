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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Users } from "lucide-react";
import type { Roommate } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  totalAmount: z.string().min(1, "Valor total é obrigatório").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valor deve ser maior que zero"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Participant {
  id: string;
  roommateId: number | null;
  name: string;
  amount: number;
  isPaid: boolean;
}

interface BillSplitModalProps {
  open: boolean;
  onClose: () => void;
}

export function BillSplitModal({ open, onClose }: BillSplitModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'self', roommateId: null, name: 'Você', amount: 0, isPaid: true }
  ]);

  const { data: roommates = [] } = useQuery<Roommate[]>({
    queryKey: ["/api/roommates"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      totalAmount: "",
      description: "",
    },
  });

  const createBillSplitMutation = useMutation({
    mutationFn: async (data: { formData: FormData; participants: Participant[] }) => {
      await apiRequest("/api/bill-splits", "POST", {
        title: data.formData.title,
        totalAmount: parseFloat(data.formData.totalAmount),
        description: data.formData.description,
        participants: data.participants.map(p => ({
          roommateId: p.roommateId,
          amount: p.amount,
          isPaid: p.isPaid
        }))
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-splits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Divisão criada",
        description: "A divisão de conta foi criada com sucesso!",
      });
      form.reset();
      setParticipants([{ id: 'self', roommateId: null, name: 'Você', amount: 0, isPaid: true }]);
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a divisão. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const addParticipant = () => {
    setParticipants([...participants, {
      id: Date.now().toString(),
      roommateId: null,
      name: '',
      amount: 0,
      isPaid: false
    }]);
  };

  const removeParticipant = (id: string) => {
    if (id === 'self') return; // Can't remove self
    setParticipants(participants.filter(p => p.id !== id));
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const splitEvenly = () => {
    const totalAmount = parseFloat(form.getValues('totalAmount') || '0');
    if (totalAmount > 0 && participants.length > 0) {
      const amountPerPerson = totalAmount / participants.length;
      setParticipants(participants.map(p => ({ ...p, amount: amountPerPerson })));
    }
  };

  const selectRoommate = (participantId: string, roommateId: number) => {
    const roommate = roommates.find(r => r.id === roommateId);
    if (roommate) {
      updateParticipant(participantId, {
        roommateId: roommate.id,
        name: roommate.name
      });
    }
  };

  const totalSplit = participants.reduce((sum, p) => sum + p.amount, 0);
  const totalAmount = parseFloat(form.watch('totalAmount') || '0');

  const onSubmit = (data: FormData) => {
    if (Math.abs(totalSplit - totalAmount) > 0.01) {
      toast({
        title: "Erro na divisão",
        description: "A soma das partes deve ser igual ao valor total.",
        variant: "destructive",
      });
      return;
    }

    createBillSplitMutation.mutate({ formData: data, participants });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Dividir Conta</span>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Conta de Internet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">R$</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00" 
                          className="pl-8"
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
                      placeholder="Detalhes sobre a despesa..."
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Participantes</h3>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={splitEvenly}>
                    Dividir Igualmente
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        {participant.id === 'self' ? (
                          <Input value="Você" disabled />
                        ) : (
                          <select
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                            value={participant.roommateId || ''}
                            onChange={(e) => {
                              const roommateId = parseInt(e.target.value);
                              selectRoommate(participant.id, roommateId);
                            }}
                          >
                            <option value="">Selecione um colega</option>
                            {roommates
                              .filter(r => !participants.some(p => p.roommateId === r.id))
                              .map(roommate => (
                                <option key={roommate.id} value={roommate.id}>
                                  {roommate.name}
                                </option>
                              ))
                            }
                          </select>
                        )}
                      </div>
                      
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 z-10">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="pl-8"
                          value={participant.amount || ''}
                          onChange={(e) => updateParticipant(participant.id, { 
                            amount: parseFloat(e.target.value) || 0 
                          })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={participant.isPaid}
                          onCheckedChange={(checked) => updateParticipant(participant.id, { 
                            isPaid: checked as boolean 
                          })}
                        />
                        <span className="text-sm">Já pago</span>
                        {participant.id !== 'self' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParticipant(participant.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Total dividido:</span>
                <span className={`font-bold ${
                  Math.abs(totalSplit - totalAmount) < 0.01 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(totalSplit)} / {formatCurrency(totalAmount)}
                </span>
              </div>
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
                disabled={createBillSplitMutation.isPending || Math.abs(totalSplit - totalAmount) > 0.01}
              >
                {createBillSplitMutation.isPending ? "Criando..." : "Criar Divisão"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
