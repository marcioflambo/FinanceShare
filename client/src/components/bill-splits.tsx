import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getInitials } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BillSplit, BillSplitParticipant, Roommate } from "@shared/schema";

interface BillSplitWithParticipants extends BillSplit {
  participants: BillSplitParticipant[];
}

export function BillSplits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billSplits = [] } = useQuery<BillSplitWithParticipants[]>({
    queryKey: ["/api/bill-splits"],
  });

  const { data: roommates = [] } = useQuery<Roommate[]>({
    queryKey: ["/api/roommates"],
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ participantId, isPaid }: { participantId: number; isPaid: boolean }) => {
      await apiRequest(`/api/bill-splits/${participantId}/payment`, "PATCH", { isPaid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-splits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Status atualizado",
        description: "Status de pagamento atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de pagamento.",
        variant: "destructive",
      });
    },
  });

  const getRoommateName = (userId: number) => {
    if (userId === 1) return "Você";
    const roommate = roommates.find(r => r.id === userId);
    return roommate ? roommate.name.split(" ")[0] : "Desconhecido";
  };

  const getStatusColor = (isPaid: boolean | null) => {
    return isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (isPaid: boolean | null) => {
    return isPaid ? "Pago" : "Pendente";
  };

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Divisão de Contas</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            Gerenciar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {billSplits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma conta dividida ainda</p>
              <p className="text-sm">Crie sua primeira divisão de conta!</p>
            </div>
          ) : (
            billSplits.slice(0, 3).map((split) => (
              <div key={split.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{split.title}</h4>
                    <p className="text-sm text-gray-600">
                      Dividido entre {split.participants.length} pessoas
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(split.totalAmount)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {split.participants.map((participant) => {
                    const roommateName = getRoommateName(participant.userId);
                    const initials = getInitials(roommateName);
                    
                    return (
                      <div key={participant.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                            participant.isPaid ? 'bg-green-500' : 'bg-yellow-500'
                          }`}>
                            {participant.isPaid ? <Check className="w-3 h-3" /> : initials[0]}
                          </div>
                          <span>{roommateName}</span>
                          <span className="text-gray-500">- {formatCurrency(participant.amount)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(participant.isPaid)}>
                            {getStatusText(participant.isPaid)}
                          </Badge>
                          {participant.userId === 1 && !participant.isPaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePaymentMutation.mutate({
                                participantId: participant.id,
                                isPaid: true
                              })}
                              disabled={updatePaymentMutation.isPending}
                            >
                              Marcar como Pago
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
